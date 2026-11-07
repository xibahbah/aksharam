"""Assemble transparent GIF reactions from the generated six-pose sheet (Pillow)."""
from pathlib import Path
from PIL import Image
import math
root=Path(__file__).resolve().parents[1]/'public/companion'
sheet=Image.open(root/'source-sheet.png').convert('RGBA')
poses=[]
for i in range(6):
    cell=sheet.crop(((i%3)*512,(i//3)*512,(i%3+1)*512,(i//3+1)*512))
    box=cell.getchannel('A').point(lambda a:255 if a>100 else 0).getbbox()
    cell=cell.crop(box); cell.thumbnail((200,218),Image.Resampling.LANCZOS)
    poses.append(cell)
def frame(p,dy=0,angle=0):
    im=poses[p].rotate(angle,Image.Resampling.BICUBIC,expand=True)
    canvas=Image.new('RGBA',(256,256)); canvas.alpha_composite(im,((256-im.width)//2,238-im.height+int(dy)))
    return canvas
frame(0).save(root/'still.png')
def gif(name,frames,duration):
    output=[]
    for im in frames:
        alpha=im.getchannel('A'); pal=im.convert('RGB').quantize(colors=255)
        pal.paste(255,mask=alpha.point(lambda a:255 if a<110 else 0)); pal.info['transparency']=255
        output.append(pal)
    output[0].save(root/f'{name}.gif',save_all=True,append_images=output[1:],duration=duration,loop=0,disposal=2,transparency=255,optimize=False)
gif('idle',[frame(0,-2*math.sin(i*math.pi/10),math.sin(i*math.pi/10)) for i in range(20)],120)
gif('cheer',[frame(1,-14*abs(math.sin(i*math.pi/8)),2*math.sin(i*math.pi/4)) if i<16 else frame(2,0,2*math.sin(i*math.pi/2)) for i in range(28)],90)
gif('oops',[frame(3,0,3*math.sin(i*math.pi/2)) if i<8 else frame(4,-3*abs(math.sin(i)),4*math.sin(i)) if i<16 else frame(5,0,12*math.sin(i*math.pi/4)) if i<28 else frame(0) for i in range(36)],90)
print('Created idle.gif, cheer.gif, oops.gif and still.png')
