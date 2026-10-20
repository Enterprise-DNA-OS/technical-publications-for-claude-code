import { parse } from 'parse5';
import { esc } from './render.mjs';
import path from 'node:path';
export const SOURCES={
 alt:'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html',
 title:'https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html',
 lang:'https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html',
 internal:'docs/compliance.md#release-policy'
};
const allowed=new Set('p div span h1 h2 h3 h4 h5 h6 ul ol li strong b em i code pre blockquote table thead tbody tfoot tr td th caption br hr dl dt dd sub sup'.split(' '));
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
function walk(n,fn){fn(n);for(const c of n.childNodes||[])walk(c,fn);}
function text(n){return n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');}
export function relativeSource(base,href){
 let s;try{s=decodeURIComponent(href.split('#')[0].split('?')[0]).replaceAll('\\','/');}catch{throw Error('Invalid encoded source path');}
 if(!s)return base;
 const result=s.startsWith('/')?'Content/'+s.replace(/^\/+/, ''):path.posix.normalize(path.posix.join(path.posix.dirname(base||'Content/topic.htm'),s));
 if(result.startsWith('../')||result.startsWith('/')||result.includes('\0'))throw Error('Source path escapes project');
 return result;
}
export function inspect(source){
 if(source.length>5_000_000)throw Error('Topic exceeds 5 MB');
 const tree=parse(source);const findings=[];const links=[];const images=[];const anchors=[];
 let title='',lang='';let body;
 walk(tree,n=>{
  const tag=n.tagName;
  if(attr(n,'id'))anchors.push(attr(n,'id'));
  if((n.attrs||[]).some(a=>/^on/i.test(a.name)))findings.push({rule:'ACTIVE ATTRIBUTE',detail:'Remove event handlers from '+tag,source:SOURCES.internal});
  if(tag==='title')title=text(n).trim();
  if(tag==='html')lang=attr(n,'lang')||attr(n,'xml:lang')||'';
  if(tag==='body')body=n;
  if(tag==='img'){
   const src=attr(n,'src')||'';const alt=attr(n,'alt');images.push({src,alt});
   if(alt===undefined)findings.push({rule:'WCAG 1.1.1',detail:'Image has no alt attribute: '+src,source:SOURCES.alt});
   if(alt==='')findings.push({rule:'MANUAL ALT REVIEW',detail:'Confirm decorative image: '+src,source:SOURCES.alt,advisory:true});
  }
  if(tag==='a'&&attr(n,'href'))links.push(attr(n,'href'));
  if(tag?.includes(':')||(n.attrs||[]).some(a=>a.name.startsWith('madcap:')))
   findings.push({rule:'UNCONVERTED FLARE',detail:'Convert '+tag+' proprietary markup before release',source:SOURCES.internal});
  if(['script','iframe','object','embed','form','style','svg','video','audio','math'].includes(tag))
   findings.push({rule:'UNSUPPORTED CONTENT',detail:'Requires conversion: '+tag,source:SOURCES.internal});
 });
 if(!title)findings.push({rule:'WCAG 2.4.2',detail:'Source has no descriptive page title',source:SOURCES.title});
 if(!lang)findings.push({rule:'WCAG 3.1.1',detail:'Source has no language attribute',source:SOURCES.lang});
 return {tree,body,title,lang,findings,links,images,anchors};
}
export function renderTopic(topic,assets=new Map(),known=new Map()){
 const parsed=inspect(topic.source_xhtml);
 function render(n){
  if(n.nodeName==='#text')return esc(n.value);
  const tag=n.tagName;const children=()=> (n.childNodes||[]).map(render).join('');
  if(!tag)return children();
  if(['script','style','iframe','object','embed','form','svg'].includes(tag))return '';
  if(tag==='img'){
   let file;try{file=relativeSource(topic.source_path,attr(n,'src')||'');}catch{return '<p>[Image requires conversion]</p>';}
   const asset=assets.get(file);const ext=path.posix.extname(file).toLowerCase();
   const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp'}[ext];
   return asset&&mime?`<img style="max-width:100%" src="data:${mime};base64,${asset}" alt="${esc(attr(n,'alt')||'')}"/>`:`<p>[Image: ${esc(attr(n,'alt')||attr(n,'src')||'conversion required')}]</p>`;
  }
  if(tag==='a'){
   const href=attr(n,'href')||'';
   if(/^https?:\/\//i.test(href))return `<a href="${esc(href)}" rel="noreferrer">${children()}</a>`;
   let target;try{target=known.get(relativeSource(topic.source_path,href));}catch{}
   let fragment='';try{fragment=href.includes('#')?decodeURIComponent(href.split('#')[1]):'';}catch{}
   if(href.startsWith('#'))target=topic.id;
   return target?`<a href="#topic-${esc(target)}${fragment?'-'+esc(fragment):''}">${children()}</a>`:children();
  }
  if(!allowed.has(tag))return children();
  const safeLang=attr(n,'lang');const id=attr(n,'id');
  return `<${tag}${id?` id="topic-${esc(topic.id)}-${esc(id)}"`:''}${safeLang?` lang="${esc(safeLang)}"`:''}>${children()}${['br','hr'].includes(tag)?'':`</${tag}>`}`;
 }
 return render(parsed.body);
}
