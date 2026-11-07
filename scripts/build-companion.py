"""Assemble 30 drawn frames; no synthetic rotation, bounce, or pose duplication.
Requires Pillow. GIF reactions play once; idle holds for most of its cycle.
"""
from pathlib import Path
import json
from PIL import Image
root=Path(__file__).resolve().parents[1]/'public/companion/v2'
timings={
 'idle':[3200,120,90,100,90,140,400,180,200,1480],
 'cheer':[180,160,160,120,180,140,200,180,180,500],
 'oops':[180,180,180,180,400,320,200,200,180,580],
}
all_frames={}
for name in timings:
 sheet=Image.open(root/f'{name}-sheet.png').convert('RGBA')
 frames=[]
 for i in range(10):
  x,y=i%5,i//5
  cell=sheet.crop((round(x*sheet.width/5),round(y*sheet.height/2),round((x+1)*sheet.width/5),round((y+1)*sheet.height/2)))
  # Ignore low-alpha matte residue when measuring the silhouette.
  box=cell.getchannel('A').point(lambda a:255 if a>=200 else 0).getbbox()
  assert box, (name,i)
  sprite=cell.crop(box)
  sprite=sprite.resize((round(sprite.width*216/sprite.height),216),Image.Resampling.LANCZOS)
  # Anchor using the feet, not shifting hand/pigtail extents.
  feet=sprite.getchannel('A').crop((0,196,sprite.width,216)).point(lambda a:255 if a>=200 else 0).getbbox()
  anchor=(feet[0]+feet[2])/2
  frame=Image.new('RGBA',(256,256));frame.alpha_composite(sprite,(round(128-anchor),20))
  frame.save(root/f'{name}-{i+1:02}.png');frames.append(frame)
 all_frames[name]=frames
# One palette across every frame prevents frame-to-frame color flicker.
atlas=Image.new('RGB',(256*10,256*3),(26,26,26))
for row,frames in enumerate(all_frames.values()):
 for col,frame in enumerate(frames):atlas.paste(frame,(col*256,row*256),frame)
palette=atlas.quantize(colors=255)
for name,frames in all_frames.items():
 output=[]
 for frame in frames:
  rgb=Image.new('RGB',frame.size,(26,26,26));rgb.paste(frame,mask=frame.getchannel('A'))
  pal=rgb.quantize(palette=palette,dither=Image.Dither.NONE)
  pal.paste(255,mask=frame.getchannel('A').point(lambda a:255 if a<170 else 0));output.append(pal)
 options={'loop':0} if name=='idle' else {}
 output[0].save(root/f'{name}.gif',save_all=True,append_images=output[1:],duration=timings[name],disposal=2,transparency=255,optimize=False,**options)
all_frames['idle'][0].save(root/'still.png')
(root/'timing.json').write_text(json.dumps({name:sum(t) for name,t in timings.items()},indent=2)+'\n')
atlas.resize((1280,384)).save(root/'frame-review.jpg')
for name in timings:
 im=Image.open(root/f'{name}.gif');assert im.n_frames==10,(name,im.n_frames)
 print(name,im.n_frames,'frames',sum(timings[name]),'ms','loop' if name=='idle' else 'once')
