(()=>{'use strict';
/* Real tile-map previews: no baked text, no screenshots, and no stretched low-resolution WebP.
 * 32x32 map grid is composited directly into a 640x240 canvas in fixed pixel units.
 */
const maps={town:window.NM_TOWN_TILEMAP,road:window.NM_ROAD_TILEMAP,cave:window.NM_CAVE_TILEMAP};
const centers={town:[19,12],road:[18,10],cave:[17,10]};
const structureData=window.NM_STRUCTURE_DATA||{town:[],road:[],cave:[]};
const structureImages={};
for(const layerList of Object.values({town:structureData.town,road:structureData.road,cave:structureData.cave})){
 for(const obj of layerList){if(structureImages[obj.image])continue;const img=new Image();img.src=obj.image;structureImages[obj.image]=img;}
}
for(const canvas of document.querySelectorAll('[data-scene-canvas]')){
 const key=canvas.dataset.sceneCanvas,map=maps[key];if(!map)continue;
 const ctx=canvas.getContext('2d');if(!ctx)continue;
 ctx.imageSmoothingEnabled=false;
 ctx.fillStyle=key==='cave'?'#252f34':'#4b7066';ctx.fillRect(0,0,640,240);
 const atlas=new Image();
 atlas.onerror=()=>{atlas.onerror=null;atlas.src=map.atlas;};
 atlas.onload=()=>{
  const [cx,cy]=centers[key],originX=Math.min(Math.max(0,Math.round(cx-10)),Math.max(0,map.width-20));
  const originY=Math.min(Math.max(0,Math.round(cy-4)),Math.max(0,map.height-8));
  for(const name of ['ground','water','terrain','building','deco_low','front']){
   const grid=map.layers[name];if(!grid)continue;
   for(let yy=0;yy<8;yy++)for(let xx=0;xx<20;xx++){
    const x=originX+xx,y=originY+yy;if(x>=map.width||y>=map.height)continue;
    const id=grid[y*map.width+x];if(id<0)continue;
    const sourceTile=atlas.naturalWidth/map.atlas_columns;
    ctx.drawImage(atlas,(id%map.atlas_columns)*sourceTile,Math.floor(id/map.atlas_columns)*sourceTile,sourceTile,sourceTile,xx*32,yy*32-8,32,32);
   }
  }
  // Render independent multi-tile structure instances; still no baked scene bitmap.
  for(const obj of structureData[key]||[]){
   const image=structureImages[obj.image];
   if(!image||!image.complete||!image.naturalWidth)continue;
   const dx=(obj.x-originX)*32,dy=(obj.y-originY)*32-8;
   const dw=obj.w*32,dh=obj.h*32;
   if(dx<640&&dy<240&&dx+dw>0&&dy+dh>0)ctx.drawImage(image,dx,dy,dw,dh);
  }
  // Hard-coded high-contrast light/shadow overlay intentionally contains no content text.
  ctx.fillStyle='#121b2655';ctx.fillRect(0,0,640,12);
 };
 atlas.src=map.atlas.replace(/\.svg$/, '_hd64.svg');
 for(const obj of structureData[key]||[]){
   const img=structureImages[obj.image];
   if(img&&!img.naturalWidth)img.onload=()=>{if(atlas.complete&&atlas.naturalWidth&&atlas.onload)atlas.onload();};
 }
}
})();
