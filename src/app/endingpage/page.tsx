"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function EndingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      countUp(setScoreP1, 8420);
      countUp(setScoreP2, 4130);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  function countUp(setter: (n: number) => void, target: number) {
    let current = 0;
    const step = Math.ceil(target / 80);
    const timer = setInterval(() => {
      current = current + step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setter(current);
    }, 16);
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (modalOpen && modalRef.current && e.target === modalRef.current) {
        setModalOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [modalOpen]);

  function postToX() {
    const text = (document.getElementById("tweet-text") as HTMLTextAreaElement)?.value || "";
    const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
    setModalOpen(false);
  }

  function playAgain() {
    const btn = document.querySelector(".btn-play") as HTMLButtonElement | null;
    if (btn) {
      btn.textContent = "Loading...";
      (btn.style as any).background = "linear-gradient(90deg, #f97316, #ec4899)";
    }
    setTimeout(() => {
      router.push("/");
    }, 1200);
  }

  return (
    <main>
      <div className="bg" />

      <div className="page">
        <div className="header">
          <p className="eyebrow">GAME OVER</p>
          <h1 className="title">WE HAVE A WINNER</h1>
        </div>

        <div className="arena">
          <div className="card winner">
            <span className="badge win">WINNER</span>
            <div className="avatar">
              <div className="crown">👑</div>
              🚶‍♂️
            </div>
            <span className="player-name">PLAYER 1</span>
            <div className="score" id="score-p1">
              {scoreP1.toLocaleString()}
            </div>
          </div>

          <div className="vs">
            <div className="vs-line" />
            <span>VS</span>
            <div className="vs-line" />
          </div>

          <div className="card loser">
            <span className="badge lose">ELIMINATED</span>
            <div className="avatar">👾</div>
            <span className="player-name">PLAYER 2</span>
            <div className="score" id="score-p2">
              {scoreP2.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="judge">
          <div className="judge-top-line" />
          <div className="judge-head">
            <div className="judge-icon">🤖</div>
            <div>
              <div className="judge-name">JUDGE_UNIT_9</div>
              <div className="judge-role">AI RHYTHM ARBITER · CERTIFIED ROASTMASTER</div>
            </div>
          </div>
          <p className="verdict">
            Player 1 came in with the energy of someone who actually practiced. Clean
            syncopation, tight zone coverage, and frankly an alarming amount of hip
            involvement. Player 2 — you moved like a Windows 98 screensaver with lag.
            The zones were glowing. They were <em>right there</em>. At one point you
            danced so far behind the beat you were technically in the previous song.
            A 4,290 point gap is not a defeat. It’s a philosophical statement. Player
            2 should consider knitting.
          </p>
        </div>

        <div className="actions">
          <button className="btn btn-x" onClick={() => setModalOpen(true)}>
            <span style={{ fontSize: 16, fontWeight: 900 }}>⌗</span>
            POST <span className="loser-hi"> PLAYER 2’S </span> FAIL
          </button>
          <button className="btn btn-play" onClick={playAgain}>
            ⏤  PLAY AGAIN
          </button>
        </div>
      </div>

      <div className={`overlay ${modalOpen ? "open" : ""}`} id="modal" ref={modalRef as any}>
        <div className="modal">
          <button className="modal-close" onClick={() => setModalOpen(false)}>
            ×
          </button>
          <div className="modal-emoji">😂</div>
          <h2 className="modal-title">POST THE FAIL</h2>
          <p className="modal-desc">Review before destroying Player 2’s dignity forever.</p>
          <textarea id="tweet-text" rows={5} defaultValue={
            `😈 Player 2 just got DESTROYED in BeatOff: The Rhythm Battle.

Score: 8,420 vs 4,130 — a 4,290 point humiliation.

Judge verdict: "You danced so far behind the beat you were in the previous song."

#BeatOff #RhythmBattle #Roasted 🔥`
          } />
          <div className="modal-btns">
            <button className="mbtn cancel" onClick={() => setModalOpen(false)}>CANCEL</button>
            <button className="mbtn post" onClick={postToX}>⌗  POST IT</button>
          </div>
        </div>
      </div>

      <style>{`
        /* Copied styles from endingpage.html (scoped to this component) */
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#080110;color:#f1e8ff;font-family:var(--font-barlow, sans-serif);min-height:100vh}
        .bg{position:fixed;top:0;left:0;right:0;bottom:0;z-index:0;background:radial-gradient(ellipse 70% 50% at 50% 0%, #2d0764, transparent 65%), #080110}
        .page{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:48px 20px 64px;gap:28px}
        .header{text-align:center}
        .eyebrow{font-family:var(--font-barlow-condensed);font-size:11px;letter-spacing:0.4em;color:#7c6d94;margin-bottom:6px}
        .title{font-family:var(--font-black-ops);font-size:60px;line-height:1;background:linear-gradient(90deg,#c084fc,#ec4899,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .arena{width:100%;max-width:800px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px}
        .card{background:rgba(20,6,45,0.75);border-radius:18px;padding:24px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;border:1px solid rgba(124,58,237,0.2)}
        .card.winner{border-color:#a3e635;box-shadow:0 0 28px rgba(163,230,53,0.18)}
        .card.loser{border-color:#f43f5e;box-shadow:0 0 20px rgba(244,63,94,0.15);opacity:0.85}
        .badge{font-family:var(--font-barlow-condensed);font-size:11px;font-weight:800;letter-spacing:0.3em;padding:3px 12px;border-radius:99px}
        .badge.win{background:rgba(163,230,53,0.12);color:#a3e635;border:1px solid #a3e635}
        .badge.lose{background:rgba(244,63,94,0.1);color:#f43f5e;border:1px solid #f43f5e}
        .avatar{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;position:relative}
        .card.winner .avatar{background:rgba(163,230,53,0.1);box-shadow:0 0 20px rgba(163,230,53,0.25)}
        .card.loser .avatar{background:rgba(244,63,94,0.08)}
        .crown{position:absolute;top:-12px;left:50%;transform:translateX(-50%);font-size:18px}
        .player-name{font-family:var(--font-barlow-condensed);font-size:20px;font-weight:800;letter-spacing:0.05em}
        .score{font-family:var(--font-black-ops);font-size:54px;line-height:1}
        .card.winner .score{color:#a3e635;text-shadow:0 0 16px rgba(163,230,53,0.45)}
        .card.loser .score{color:#f43f5e}
        .vs{display:flex;flex-direction:column;align-items:center;gap:8px}
        .vs span{font-family:var(--font-black-ops);font-size:24px;color:#7c6d94}
        .vs-line{width:1px;height:50px;background:linear-gradient(to bottom, transparent, rgba(124,58,237,0.35), transparent)}
        .judge{width:100%;max-width:800px;background:rgba(12,2,26,0.85);border:1px solid rgba(236,72,153,0.28);border-radius:18px;padding:24px 28px;position:relative}
        .judge-top-line{position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#ec4899,#7c3aed,transparent);border-radius:18px 18px 0 0}
        .judge-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}
        .judge-icon{width:44px;height:44px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#5b21b6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 14px rgba(236,72,153,0.35)}
        .judge-name{font-family:var(--font-barlow-condensed);font-size:14px;font-weight:800;letter-spacing:0.1em;color:#c084fc}
        .judge-role{font-size:10px;color:#7c6d94;letter-spacing:0.15em;margin-top:2px}
        .verdict{font-size:14.5px;line-height:1.7;color:#d9ccee;font-style:italic;padding-left:20px;border-left:2px solid rgba(236,72,153,0.3)}
        .actions{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;width:100%;max-width:800px}
        .btn{display:flex;align-items:center;gap:9px;padding:15px 26px;border-radius:50px;border:none;font-family:var(--font-barlow-condensed);font-size:15px;font-weight:800;letter-spacing:0.1em;cursor:pointer}
        .btn-x{background:#000;color:#fff;border:1px solid rgba(255,255,255,0.15)}
        .btn-play{background:linear-gradient(90deg,#a855f7,#ec4899);color:#fff;min-width:180px;justify-content:center}
        .loser-hi{color:#f43f5e}
        .overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:100;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;visibility:hidden;opacity:0}
        .overlay.open{visibility:visible;opacity:1}
        .modal{background:#0f0320;border:1px solid rgba(236,72,153,0.3);border-radius:20px;padding:32px 28px;max-width:400px;width:90%;text-align:center;position:relative;box-shadow:0 0 50px rgba(236,72,153,0.2)}
        .modal-close{position:absolute;top:12px;right:14px;background:none;border:none;color:#7c6d94;font-size:22px;cursor:pointer;line-height:1}
        .modal-emoji{font-size:40px;margin-bottom:8px}
        .modal-title{font-family:var(--font-black-ops);font-size:22px;margin-bottom:6px;background:linear-gradient(90deg,#ec4899,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .modal-desc{font-size:13px;color:#b09dc4;margin-bottom:16px;line-height:1.5}
        .modal textarea{width:100%;background:rgba(20,6,45,0.9);border:1px solid rgba(124,58,237,0.3);border-radius:10px;color:#f1e8ff;font-family:var(--font-barlow);font-size:13px;padding:10px 12px;resize:none;outline:none;line-height:1.5;margin-bottom:14px}
        .modal-btns{display:flex;gap:10px;justify-content:center}
        .mbtn{padding:11px 22px;border-radius:99px;border:none;font-family:var(--font-barlow-condensed);font-size:13px;font-weight:800;letter-spacing:0.1em;cursor:pointer}
        .mbtn.cancel{background:rgba(124,58,237,0.18);color:#c084fc;border:1px solid rgba(124,58,237,0.3)}
        .mbtn.post{background:#000;color:#fff;border:1px solid rgba(255,255,255,0.2)}
      `}</style>
    </main>
  );
}
