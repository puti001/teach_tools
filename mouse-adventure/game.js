const $=s=>document.querySelector(s);
const area=$('#play-area'),title=$('#title'),instruction=$('#instruction'),coach=$('#coach-text'),next=$('#next-button');
let stage=1,score=0,combo=0,remaining=0,timer,active=false,goal=0,hits=0,soundOn=true,audio;
const record=Number(localStorage.getItem('mouseHeroRecord')||0);$('#record').textContent=record;

$('#sound-toggle').onclick=()=>{soundOn=!soundOn;$('#sound-toggle').textContent=soundOn?'🔊 音效':'🔇 靜音';$('#sound-toggle').classList.toggle('muted',!soundOn);if(soundOn)sound('star')};
$('#home-button').onclick=()=>home();
function sound(kind){if(!soundOn)return;try{audio??=new AudioContext();const n=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();const p={star:[880,.16,'sine'],bubble:[520,.14,'sine'],bug:[360,.11,'square'],apple:[660,.22,'triangle'],win:[990,.4,'triangle']}[kind];o.type=p[2];o.frequency.setValueAtTime(p[0],n);o.frequency.exponentialRampToValueAtTime(kind==='bubble'?170:p[0]*1.45,n+p[1]);g.gain.setValueAtTime(.001,n);g.gain.exponentialRampToValueAtTime(.16,n+.015);g.gain.exponentialRampToValueAtTime(.001,n+p[1]);o.connect(g).connect(audio.destination);o.start();o.stop(n+p[1])}catch(e){}}
function random(a,b){return Math.floor(Math.random()*(b-a)+a)}
function point(value,kind,event){sound(kind);combo++;score+=value+Math.min(combo*2,30);$('#score').textContent=score;$('#combo').textContent=combo;const x=event?.offsetX||250,y=event?.offsetY||140;const el=document.createElement('b');el.className='burst';el.style.left=x+'px';el.style.top=y+'px';el.textContent='+'+(value+Math.min(combo*2,30));area.append(el);setTimeout(()=>el.remove(),700)}
function startTime(seconds){clearInterval(timer);remaining=seconds;active=true;const tick=()=>{$('#timer').textContent=remaining;if(remaining--<=0)finish(false)};tick();timer=setInterval(tick,1000)}
function finish(win){if(!active)return;active=false;clearInterval(timer);if(win){sound('win');popup('🎉 任務完成！');next.textContent=stage===4?'看看總成績 🏆':'下一關 →'}else{combo=0;$('#combo').textContent=0;popup('⏰ 時間到了！再試一次！');next.textContent='再挑戰一次 ↻'}next.classList.remove('hidden')}
function popup(text){const p=$('#celebration');p.innerHTML='<div>'+text+'</div>';p.classList.remove('hidden');setTimeout(()=>p.classList.add('hidden'),900)}
function header(){area.innerHTML='';area.className='play-area stage-'+stage;next.classList.add('hidden');$('#stage-label').textContent=`第 ${stage} 關 / 6`;document.querySelectorAll('.dots i').forEach((x,i)=>x.classList.toggle('active',i<stage));combo=0;$('#combo').textContent=0}
function target(kind){const b=document.createElement('button');b.className='target '+kind;b.textContent=kind==='star'?'★':kind==='bug'?'🐛':'●';b.style.left=random(7,84)+'%';b.style.top=random(12,68)+'%';return b}
function stars(){goal=12;hits=0;title.textContent='第一關：流星捕手';instruction.textContent='35 秒內收集 12 顆星星！';coach.textContent='每點到一顆星星，都會有清脆的叮咚聲。';startTime(35);const spawn=()=>{if(!active)return;const x=target('star');x.onclick=e=>{hits++;point(10,'star',e);x.remove();hits===goal?finish(true):setTimeout(spawn,240)};area.append(x)};area.onclick=e=>{if(e.target===area){combo=0;$('#combo').textContent=0}};spawn()}
function bubbles(){goal=10;hits=0;title.textContent='第二關：泡泡快手';instruction.textContent='快速雙擊 10 顆泡泡！';coach.textContent='泡泡啵一聲消失，雙擊完成時分數更多。';startTime(35);const spawn=()=>{if(!active)return;const x=target('bubble');x.onclick=()=>x.classList.add('shrunk');x.ondblclick=e=>{hits++;point(14,'bubble',e);x.remove();hits===goal?finish(true):setTimeout(spawn,300)};area.append(x);setTimeout(()=>{if(x.isConnected){x.remove();combo=0;$('#combo').textContent=0;spawn()}},2800)};spawn()}
function bugs(){goal=10;hits=0;let speed=1;title.textContent='第三關：毛毛蟲追追追';instruction.textContent='調整你喜歡的速度，抓到 10 隻就過關！';coach.textContent='慢速比較容易，快速雖然難，得到的分數比較多。';area.innerHTML='<div class="speed-control">毛毛蟲速度：<input id="speed" type="range" min="1" max="5" value="1"><span id="speed-name" class="speed-badge">慢速・10分</span></div>';const slider=$('#speed'),name=$('#speed-name');slider.oninput=()=>{speed=Number(slider.value);name.textContent=['慢速・10分','輕快・14分','挑戰・18分','快速・23分','閃電・30分'][speed-1]};startTime(45);const spawn=()=>{if(!active)return;const x=target('bug');const move=setInterval(()=>{x.style.left=random(7,84)+'%';x.style.top=random(12,65)+'%'},[1050,800,620,460,330][speed-1]);x.onclick=e=>{clearInterval(move);hits++;point([10,14,18,23,30][speed-1],'bug',e);x.remove();hits===goal?finish(true):setTimeout(spawn,250)};area.append(x)};spawn()}
function apples(){goal=5;hits=0;title.textContent='最終關：水果救援隊';instruction.textContent='把 5 顆蘋果拖到籃子裡！';coach.textContent='每次成功放進籃子，都有一段開心的完成音效。';startTime(55);const spawn=()=>{if(!active)return;area.innerHTML='<div class="rescue"><div id="fruit" class="fruit" draggable="true">🍎</div><div id="basket" class="basket">🧺<small>蘋果籃</small></div></div>';const fruit=$('#fruit'),basket=$('#basket');fruit.ondragstart=e=>e.dataTransfer.setData('fruit','apple');basket.ondragover=e=>{e.preventDefault();basket.classList.add('over')};basket.ondrop=e=>{e.preventDefault();hits++;point(22,'apple');hits===goal?finish(true):setTimeout(spawn,450)}};spawn()}
function wheel(){goal=6;hits=0;title.textContent='第五關：滾輪尋寶';instruction.textContent='向下滾動滾輪，找到 6 個藏起來的寶物！';coach.textContent='慢慢往下滾，看到寶物後點一下收集。';startTime(45);area.innerHTML='<div class="wheel-world"><div class="wheel-arrow">⬇</div><h2>往下滾動找寶物</h2><p class="wheel-count">已找到 0 / 6</p><div class="wheel-prize">🎁</div><div class="wheel-prize">🍀</div><div class="wheel-prize">🌈</div><div class="wheel-prize">🪙</div><div class="wheel-prize">🎈</div><div class="wheel-prize">🏆</div></div>';area.querySelectorAll('.wheel-prize').forEach(item=>item.onclick=e=>{hits++;point(14,'star',e);item.textContent='✅';item.style.pointerEvents='none';area.querySelector('.wheel-count').textContent=`已找到 ${hits} / 6`;if(hits===goal)finish(true)})}
function rightClick(){goal=8;hits=0;title.textContent='第六關：右鍵小偵探';instruction.textContent='在黃色圖案上按右鍵，完成 8 次！';coach.textContent='右鍵通常用中指按；按對會有聲音和分數。';startTime(40);const spawn=()=>{if(!active)return;area.innerHTML='<div class="right-zone"><button class="right-target" aria-label="在這裡按右鍵">🔍</button></div>';const target=$('.right-target');target.oncontextmenu=e=>{e.preventDefault();hits++;point(15,'bug',e);target.textContent='✅';if(hits===goal)finish(true);else setTimeout(spawn,400)}};spawn()}
function load(){header();[stars,bubbles,bugs,apples,wheel,rightClick][stage-1]()}
function home(){
  active=false;clearInterval(timer);next.classList.add('hidden');
  title.textContent='選一個任務開始吧！';instruction.textContent='每一關都可以自由選擇，也可以隨時回首頁。';coach.textContent='先選最想玩的關卡，慢慢練習就會越來越厲害！';
  $('#stage-label').textContent='自由選關';document.querySelectorAll('.dots i').forEach(x=>x.classList.remove('active'));
  area.className='play-area home-menu';
  area.innerHTML='<div class="level-grid"><button class="level-card" data-level="1"><span>⭐</span>流星捕手<small>單擊練習</small></button><button class="level-card" data-level="2"><span>🫧</span>泡泡快手<small>雙擊練習</small></button><button class="level-card" data-level="3"><span>🐛</span>毛毛蟲追追追<small>速度挑戰</small></button><button class="level-card" data-level="4"><span>🍎</span>水果救援隊<small>拖曳練習</small></button><button class="level-card" data-level="5"><span>🖱️</span>滾輪尋寶<small>滾輪練習</small></button><button class="level-card" data-level="6"><span>🔍</span>右鍵小偵探<small>右鍵練習</small></button></div>';
  area.querySelectorAll('[data-level]').forEach(button=>button.onclick=()=>{stage=Number(button.dataset.level);load()});
}
next.onclick=()=>{if(remaining<=0){load();return}if(stage<6){stage++;load()}else{const best=Math.max(score,record);localStorage.setItem('mouseHeroRecord',best);$('#record').textContent=best;$('#celebration').innerHTML=`<div>🏆<br>滑鼠小勇士！<br><small>本次 ${score} 分，最高 ${best} 分</small><br><button class="next-button" onclick="location.reload()">挑戰新紀錄 ↻</button></div>`;$('#celebration').classList.remove('hidden')}};
home();

// Bubble pops use a brighter, noticeably louder sound so a successful double-click is unmistakable.
function sound(kind){
  if(!soundOn)return;
  try{
    audio??=new AudioContext();
    const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
    const setting={star:[880,.16,'sine',.16],bubble:[520,.18,'sine',.38],bug:[360,.11,'square',.16],apple:[660,.22,'triangle',.2],win:[990,.4,'triangle',.22]}[kind];
    osc.type=setting[2];osc.frequency.setValueAtTime(setting[0],now);
    osc.frequency.exponentialRampToValueAtTime(kind==='bubble'?150:setting[0]*1.45,now+setting[1]);
    gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(setting[3],now+.012);gain.gain.exponentialRampToValueAtTime(.001,now+setting[1]);
    osc.connect(gain).connect(audio.destination);osc.start();osc.stop(now+setting[1]);
  }catch(e){}
}
