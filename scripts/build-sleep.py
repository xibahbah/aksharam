"""Build a one-shot settle, quiet sleep loop and reverse wake from drawn frames.
Requires Pillow. Uses a shared physical scale (never stretches seated poses).
"""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]/'public/companion/sleep-v1'
def sprites(name, split):
 im=Image.open(root/f'{name}-sheet.png').convert('RGBA')
 result=[]
 for i in range(10):
  x=i%5; y=i//5
  cell=im.crop((round(x*im.width/5),0 if y==0 else split,round((x+1)*im.width/5),split if y==0 else im.height))
  alpha=cell.getchannel('A').point(lambda a:255 if a>=235 else 0)
  cell.putalpha(alpha)
  box=alpha.getbbox(); assert box
  result.append(cell.crop(box))
 return result
settling=sprites('settling',420)
sleeping=sprites('sleeping',400)
scale=216/settling[0].height
# Match the sleeping sheet to the final seated pose, not the standing height.
sleep_scale=settling[-1].height*scale/sleeping[0].height
def frame(sprite, factor):
 sprite=sprite.resize((round(sprite.width*factor),round(sprite.height*factor)),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(256,256))
 out.alpha_composite(sprite,((256-sprite.width)//2,236-sprite.height))
 return out
settling=[frame(s,scale) for s in settling]
sleeping=[frame(s,sleep_scale) for s in sleeping]
# Exact standing bookend prevents a cut to a new neutral drawing.
standing=Image.open(root.parent/'v3/still.png').convert('RGBA')
settling.insert(0,standing)
# Share the seated bookend at both joins.
settling.append(sleeping[0])
waking=list(reversed(settling))
sequences={'settling':settling,'sleeping':sleeping,'waking':waking}
times={'settling':[200]+[180]*10+[200], 'sleeping':[600]*10,'waking':[200]+[160]*10+[200]}
atlas=Image.new('RGB',(256*12,256*3),(26,26,26))
for row,frames in enumerate(sequences.values()):
 for col,f in enumerate(frames):atlas.paste(f,(col*256,row*256),f)
palette=atlas.quantize(colors=255)
for name,frames in sequences.items():
 output=[]
 for i,f in enumerate(frames):
  f.save(root/f'{name}-{i+1:02}.png')
  rgb=Image.new('RGB',f.size,(26,26,26));rgb.paste(f,mask=f.getchannel('A'))
  pal=rgb.quantize(palette=palette,dither=Image.Dither.NONE)
  pal.paste(255,mask=f.getchannel('A').point(lambda a:255 if a<220 else 0));output.append(pal)
 opts={'loop':0} if name=='sleeping' else {}
 output[0].save(root/f'{name}.gif',save_all=True,append_images=output[1:],duration=times[name],disposal=2,transparency=255,optimize=False,**opts)
 im=Image.open(root/f'{name}.gif');assert im.n_frames==len(frames)
 print(name,im.n_frames,sum(times[name]))
sleeping[0].save(root/'still.png')
atlas.resize((1536,384)).save(root/'review.jpg')
(root/'timing.json').write_text(json.dumps({n:sum(t) for n,t in times.items()},indent=2)+'\n')
