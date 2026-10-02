import test from 'node:test';
import assert from 'node:assert/strict';
import { readSlides, writeSlides, snapshotSlide, SLIDES_KEY } from '../src/slideStore.js';
const scene = {x:-200,y:50,width:1200,height:700};
const validate = board => { if(board?.version!==1)throw Error();return board; };
function storage() { const data=new Map(); return { getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value) }; }
test('saving captures editable state independently and survives reload', () => {
  const store=storage();
  const board={version:1,rotation:210,planetScale:1.4,planets:[{id:'p',angle:219.845}],texts:[{text:'Nota de aula'}]};
  const slide=snapshotSlide(board,scene,1,'slide-a');
  board.planets[0].angle=0;board.texts[0].text='Alterado';
  writeSlides(store,[slide],2);
  const loaded=readSlides(store,validate);
  assert.equal(loaded.error,false);assert.equal(loaded.nextNumber,2);
  assert.equal(loaded.slides[0].board.planets[0].angle,219.845);
  assert.equal(loaded.slides[0].board.texts[0].text,'Nota de aula');
  assert.equal(loaded.slides[0].board.planetScale,1.4);
  assert.deepEqual(loaded.slides[0].scene,scene);
  assert.equal('image' in loaded.slides[0],false);
});
test('empty storage starts a collection; deleting does not reuse slide numbers', () => {
  const store=storage();assert.deepEqual(readSlides(store,validate),{slides:[],nextNumber:1,error:false});
  writeSlides(store,[],5);assert.equal(readSlides(store,validate).nextNumber,5);
});
test('unavailable storage and corrupt snapshots report failure', () => {
  assert.equal(readSlides({getItem(){throw Error();}},validate).error,true);
  assert.throws(()=>writeSlides({setItem(){throw Error('Quota');}},[],1));
  const store=storage();store.setItem(SLIDES_KEY,'invalid');assert.equal(readSlides(store,validate).error,true);
  writeSlides(store,[snapshotSlide({version:99},scene,1,'a')],2);assert.equal(readSlides(store,validate).error,true);
});
