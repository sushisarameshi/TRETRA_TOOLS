!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t(require("wanakana")):"function"==typeof define&&define.amd?define(["wanakana"],t):"object"==typeof exports?exports["../wanakana"]=t(require("wanakana")):e["../wanakana"]=t(e.wanakana)}(self,(e=>(()=>{"use strict";var t={968:t=>{t.exports=e}},n={};function a(e){const t=document.querySelectorAll('#release-period-container input[type="checkbox"]:checked'),n=Array.from(t).map((e=>e.value));return e.filter((e=>n.includes(e.rel)))}async function r(e){try{return(await fetch(e,{method:"HEAD"})).ok}catch(e){return!1}}var o=function e(a){var r=n[a];if(void 0!==r)return r.exports;var o=n[a]={exports:{}};return t[a](o,o.exports,e),o.exports}(968);const c=["png","jpg","jpeg"];async function d(e){const t=document.getElementById("preselected-cards").value.split(",").map((e=>parseInt(e.trim(),10))).filter((e=>!isNaN(e)));try{const n=e.map((e=>parseInt(e.id,10))),a=await async function(e,t=2,n=[],a=[]){const o="src/data/img/card_list/";if(a.length*t<e)throw new Error("指定した範囲では十分な数のカードを選択できません。カードの範囲を見直してください。");const c=[],d={},i=["png","jpg","jpeg","gif","webp"];let s=0;for(const e of n){let a=`${o}${e}.png`;for(const e of i){const t=`${o}${n[s]}.${e}`;if(await r(t)){a=t;break}}d[a]||(d[a]=0),d[a]<t&&(c.push(a),d[a]++),s++}for(;c.length<e;){const e=Math.floor(Math.random()*a.length);let n=null;for(const t of i){const c=`${o}${a[e]}.${t}`;if(await r(c)){n=c;break}}n&&(d[n]||(d[n]=0),d[n]<t&&(c.push(n),d[n]++))}return c}(10,2,t,n);return a.sort(((e,t)=>parseInt(e.match(/(\d+)\./)[1],10)-parseInt(t.match(/(\d+)\./)[1],10))),a.map((e=>{let t=null;for(const n of c){const a=e.match(new RegExp(`(\\d+)\\.${n}$`));if(a){t=parseInt(a[1],10);break}}if(null===t)return console.error(`URL does not match any supported pattern: ${e}`),{url:e,card:null};const n=window.allCards.find((e=>parseInt(e.id,10)===t));return n||console.error(`Card with ID ${t} not found in allCards.`),{url:e,card:n}}))}catch(e){return alert(e.message),[]}}let i=!1;async function s(){if(i)return;i=!0;const e=window.filteredCards||[],t=await d(e),n=document.getElementById("image-container");if(n.innerHTML="",0===e.length){const e=a(window.allCards),t=await d(e);if(t.length>0)for(const{url:e,card:a}of t){const t=document.createElement("div");t.classList.add("card-div");const o=document.createElement("img");try{const t=await r(e);o.src=t?e:"./data/img/card_list/0.png"}catch(t){console.error(`Failed to check image existence for ${e}: ${t}`),o.src="./data/img/card_list/0.png"}const c=document.createElement("p");c.textContent=a?a.name:"不明なカード",n.appendChild(t),t.appendChild(c),t.appendChild(o)}else alert("デフォルトで選択されたチェックボックスでも画像がありません。")}else for(const{url:e,card:a}of t){const t=document.createElement("div");t.classList.add("card-div");const o=document.createElement("img");try{const t=await r(e);o.src=t?e:"./data/img/card_list/0.png"}catch(t){console.error(`Failed to check image existence for ${e}: ${t}`),o.src="./data/img/card_list/0.png"}const c=document.createElement("p");c.textContent=a?a.id+". "+a.name:"不明なカード",n.appendChild(t),t.appendChild(c),t.appendChild(o)}i=!1}function l(e){const t=document.getElementById("card-select");t.innerHTML="",e.forEach((e=>{const n=document.createElement("option");n.value=e.id,parseFloat(e.rel)?n.textContent=e.id+". "+e.name+" [第"+e.rel+"弾]":n.textContent=e.id+". "+e.name+" ["+e.rel+"]",t.appendChild(n)}))}return window.onload=()=>{(async function(){try{const e=await async function(){try{const e=await fetch("src/data/Card_Rel.csv"),t=(await e.text()).split("\n").slice(1),n={};return t.forEach((e=>{const[t,a]=e.split(",");n[t]=a.trim()})),n}catch(e){return console.error("Error loading CSV (Card_Rel.csv):",e),{}}}(),t=await fetch("src/data/TRETRA_Card.csv"),n=(await t.text()).split("\n").slice(1).map((t=>{const n=t.split(","),a=e[n[2]]||n[2];return{id:n[0],name:n[1],rel:a,streng:n[3],strengAdd:n[4],tres:n[5],order:n[6],mainTxt:n[7],frebTxt:n[8],illustrator:n[9]}}));return function(e){const t=document.getElementById("release-period-container");[...new Set(e.map((e=>e.rel)))].forEach((e=>{const n=document.createElement("input");n.type="checkbox",n.value=e,n.id=`release-period-${e}`,n.checked=!0;const a=document.createElement("label");a.htmlFor=n.id,parseFloat(e)?a.textContent=" 第"+e+"弾":a.textContent=" "+e,t.appendChild(n),t.appendChild(a),t.appendChild(document.createElement("br"))}))}(n),n}catch(e){console.error("Error loading CSV (DataBase):",e)}})().then((e=>{window.allCards=e;const t=a(e);window.filteredCards=t,l(e),s()})).catch((e=>{console.error("Error loading cards:",e)}))},document.getElementById("change-images-button").addEventListener("click",(()=>{if(window.allCards){const e=a(window.allCards);window.filteredCards=e,s()}})),document.getElementById("card-search").addEventListener("keyup",(function(){const e=o.toHiragana(this.value);l(window.allCards.filter((t=>o.toHiragana(t.name).includes(e))))})),document.getElementById("add-selected-card-button").addEventListener("click",(()=>{const e=document.getElementById("card-select"),t=e.value,n=document.getElementById("preselected-cards"),a=document.getElementById("selected-cards-container"),r=n.value.split(",").map((e=>e.trim()));if(r.filter((e=>e===t)).length<2&&r.length<10){const r=e.options[e.selectedIndex].text;n.value+=n.value?`,${t}`:t;const o=document.createElement("div");o.className="selected-card",o.setAttribute("data-card-id",t),o.innerHTML=`\n            <span>${r}</span>\n            <button class="remove-card-button"> × 削除</button>\n        `,a.appendChild(o),o.querySelector(".remove-card-button").addEventListener("click",(()=>{const e=o.getAttribute("data-card-id");n.value=n.value.split(",").filter((t=>t!==e)).join(","),a.removeChild(o)}))}})),window.addEventListener("resize",function(e){let t;return function(...n){const a=this;clearTimeout(t),t=setTimeout((()=>e.apply(a,n)),300)}}((()=>{!function(){const e=document.getElementById("image-container").getElementsByTagName("img");for(let t of e);}()}))),{}})()));
//# sourceMappingURL=bundle.js.map