"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useInView } from "@/lib/use-in-view";
import styles from "./game-frame.module.css";

type GameFrameProps = {
  html: string;
  title: string;
  /** CSS aspect-ratio for the framed area. Default square. */
  aspect?: string;
  /** Fixed virtual viewport (px) the game renders into before scaling. */
  virtual?: number;
  interactive?: boolean;
  lazy?: boolean;
  /**
   * Drives the embedded game with synthetic input so a non-interactive preview
   * shows live gameplay (and auto-restarts on game over) instead of resting on a
   * "Start"/"Game over" screen. Ignored for interactive frames, where a real
   * person plays.
   */
  autoplay?: boolean;
  className?: string;
};

/**
 * Self-running "demo player" injected into preview iframes. The iframe is
 * sandboxed (allow-scripts, no same-origin), so the parent cannot reach in to
 * drive the game; this script runs inside the frame and dispatches input to the
 * game's own listeners.
 *
 * It plays by tracing a clockwise rectangle (only 90-degree turns, so snakes
 * never reverse into themselves) and nudges a paddle with mouse moves. Crucially,
 * a watchdog samples the game's own canvas/DOM every ~600ms: a live game keeps
 * changing, but a "Game over"/"Start" screen is frozen. When it detects a frozen
 * frame it fires an aggressive revive (Space, Enter, R, click, arrow) to restart;
 * if it stays frozen it hard-reloads the frame. So the preview always loops back
 * into gameplay instead of resting on a static "Game over".
 */
const AUTOPLAY_BOT = `(function(){
  if (window.__abgBot) return; window.__abgBot = true;
  var KC={ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39,w:87,a:65,s:83,d:68,r:82,R:82,' ':32,Enter:13};
  var CODE={ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight',w:'KeyW',a:'KeyA',s:'KeyS',d:'KeyD',r:'KeyR',R:'KeyR',' ':'Space',Enter:'Enter'};
  function canvas(){ return document.querySelector('canvas'); }
  function targets(){ var t=[document,document.body,document.documentElement]; var c=canvas(); if(c)t.push(c); return t; }
  function key(type,k){
    var kc=KC[k]||0, ev;
    try{ ev=new KeyboardEvent(type,{key:k,code:CODE[k]||'',keyCode:kc,which:kc,bubbles:true,cancelable:true}); }
    catch(e){ ev=document.createEvent('Event'); ev.initEvent(type,true,true); }
    try{Object.defineProperty(ev,'keyCode',{get:function(){return kc;}});}catch(e){}
    try{Object.defineProperty(ev,'which',{get:function(){return kc;}});}catch(e){}
    try{Object.defineProperty(ev,'key',{get:function(){return k;}});}catch(e){}
    try{Object.defineProperty(ev,'code',{get:function(){return CODE[k]||'';}});}catch(e){}
    targets().forEach(function(t){try{t.dispatchEvent(ev);}catch(e){}});
    try{window.dispatchEvent(ev);}catch(e){}
  }
  function tap(k){ key('keydown',k); setTimeout(function(){key('keyup',k);},60); }
  function dir(pair){ tap(pair[0]); tap(pair[1]); }
  function rect(){ var c=canvas(); if(c&&c.getBoundingClientRect){var r=c.getBoundingClientRect(); if(r.width)return r;} return {left:0,top:0,width:window.innerWidth||640,height:window.innerHeight||640}; }
  function mouse(type,x,y){ var ev; try{ ev=new MouseEvent(type,{clientX:x,clientY:y,button:0,bubbles:true,cancelable:true}); }catch(e){return;} targets().forEach(function(t){try{t.dispatchEvent(ev);}catch(e){}}); }
  function revive(){
    tap(' '); tap('Enter'); tap('r'); tap('R');
    var r=rect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    mouse('mousedown',cx,cy); mouse('mouseup',cx,cy); mouse('click',cx,cy);
    // Many games only start/restart via a real button (Play / START / Play Again);
    // coordinate clicks do not hit-test, so click the actual button elements.
    var bs=document.querySelectorAll('button,[role=button],input[type=button],input[type=submit]');
    for(var bi=0;bi<bs.length;bi++){ try{ bs[bi].click(); }catch(e){} }
    tap('ArrowRight'); tap('d');
  }
  // Cheap fingerprint of the current frame: scaled canvas pixels when available,
  // else a hash of the DOM. Lets the watchdog tell "still playing" from "frozen".
  var off=null,offctx=null;
  function snap(){
    var c=canvas();
    if(c&&c.width&&c.height){
      try{
        if(!off){off=document.createElement('canvas');off.width=24;off.height=24;offctx=off.getContext('2d');}
        offctx.clearRect(0,0,24,24); offctx.drawImage(c,0,0,24,24);
        var d=offctx.getImageData(0,0,24,24).data, s=0;
        for(var p=0;p<d.length;p+=4){ s=(s*131+d[p]*7+d[p+1]*5+d[p+2]*3+1)>>>0; }
        return 'C'+s;
      }catch(e){ return 'TAINT'; }
    }
    try{ var b=document.body; if(!b) return null; var h=b.innerHTML, s2=h.length>>>0;
      for(var q=0;q<h.length;q+=29){ s2=(s2*131+h.charCodeAt(q))>>>0; } return 'D'+s2;
    }catch(e){ return null; }
  }
  var seq=[['ArrowRight','d'],['ArrowRight','d'],['ArrowRight','d'],['ArrowRight','d'],
           ['ArrowDown','s'],['ArrowDown','s'],['ArrowDown','s'],['ArrowDown','s'],
           ['ArrowLeft','a'],['ArrowLeft','a'],['ArrowLeft','a'],['ArrowLeft','a'],
           ['ArrowUp','w'],['ArrowUp','w'],['ArrowUp','w'],['ArrowUp','w']];
  var i=0,last=null,still=0,blind=0;
  function begin(){
    revive();
    // Drive movement (and paddles) with the keyboard only. A synthetic mouse
    // sweep used to also move paddles, but games that take BOTH mouse and keys
    // (e.g. MiniMax Breakout) set the paddle target from each, so the two
    // fought and the paddle visibly shook. Keys alone keep it smooth.
    setInterval(function(){ dir(seq[i%seq.length]); i++; }, 240);
    setInterval(function(){
      var s=snap();
      if(s===null) return;
      if(s==='TAINT'){ blind++; if(blind%5===0) revive(); if(blind%14===0){ try{location.reload();}catch(e){} } return; }
      if(s===last){ still++; } else { still=0; last=s; }
      if(still===3){ revive(); }
      else if(still>=6){ still=0; try{location.reload();}catch(e){} }
    }, 600);
  }
  if(document.readyState==='complete'||document.readyState==='interactive') setTimeout(begin,400);
  else window.addEventListener('load',function(){setTimeout(begin,400);});
})();`;

function withAutoplay(html: string): string {
  const tag = `<script>${AUTOPLAY_BOT}</script>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${tag}</body>`);
  }
  return html + tag;
}

/**
 * Renders an embedded game at a fixed virtual viewport, then scales the whole
 * iframe to "contain" it in the responsive container. Because each game centers
 * its fixed-pixel canvas inside the virtual viewport, every game shows in full
 * (no clipping) regardless of its native aspect ratio. One frame primitive is
 * reused for cards, the play page, and the table hover popup for consistency.
 */
export function GameFrame({
  html,
  title,
  aspect = "1 / 1",
  virtual = 640,
  interactive = false,
  lazy = false,
  autoplay = false,
  className
}: GameFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ scale: 0, x: 0, y: 0 });
  const { ref: inViewRef, inView } = useInView<HTMLDivElement>();

  // Drive the demo only in non-interactive previews; the play page is for people.
  const srcDoc = useMemo(
    () => (autoplay && !interactive ? withAutoplay(html) : html),
    [html, autoplay, interactive]
  );

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      if (!width || !height) {
        return;
      }
      const scale = Math.min(width, height) / virtual;
      setLayout({
        scale,
        x: (width - virtual * scale) / 2,
        y: (height - virtual * scale) / 2
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [virtual]);

  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    inViewRef.current = node;
  };

  const mount = interactive || !lazy || inView;

  return (
    <div
      ref={setRefs}
      className={`${styles.frame} ${className ?? ""}`}
      style={{ aspectRatio: aspect }}
    >
      {mount && layout.scale > 0 ? (
        <iframe
          className={styles.iframe}
          title={title}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          loading={interactive ? undefined : "lazy"}
          tabIndex={interactive ? 0 : -1}
          aria-hidden={interactive ? undefined : true}
          style={{
            width: `${virtual}px`,
            height: `${virtual}px`,
            transform: `translate(${layout.x}px, ${layout.y}px) scale(${layout.scale})`,
            pointerEvents: interactive ? "auto" : "none"
          }}
        />
      ) : null}
    </div>
  );
}
