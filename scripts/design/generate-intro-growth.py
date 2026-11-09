"""Bake planar silhouette growth. Authoring only: numpy, scipy, Pillow, contourpy.
No vertex correspondence or rotation: interpolate signed distances to the boundary.
The checked-in frames have no Python/browser-canvas dependency at runtime.
"""
from pathlib import Path
import json, re, math
import numpy as np
from scipy.ndimage import distance_transform_edt, gaussian_filter
from scipy.spatial import ConvexHull
from PIL import Image, ImageDraw
import contourpy

ROOT = Path(__file__).resolve().parents[2]
source = (ROOT / 'src/components/intro-art.ts').read_text()
shapes = [json.loads(re.search(r'export const '+name+r' = (".*?");', source).group(1)) for name in ['LEFT_FIGURE','RIGHT_FIGURE','BOAT']]
STEP = 2
W, H = 601, 411

def flatten(d):
    tokens = re.findall(r'[MLCQZ]|-?\d+(?:\.\d+)?', d)
    points=[]; pos=0; current=np.zeros(2)
    while pos<len(tokens):
        cmd=tokens[pos];pos+=1
        if cmd=='Z': break
        n={'M':2,'L':2,'C':6,'Q':4}[cmd]
        coords=np.array([float(x) for x in tokens[pos:pos+n]]).reshape(-1,2);pos+=n
        if cmd in ['M','L']:
            current=coords[0];points.append(current.copy())
        else:
            start=current.copy()
            # Keep short finger segments as well as long body curves smooth.
            samples=max(8,int(sum(np.linalg.norm(b-a) for a,b in zip(np.vstack([start,coords])[:-1],coords))/2))
            for t in np.linspace(0,1,samples)[1:]:
                if cmd=='C': point=(1-t)**3*start+3*(1-t)**2*t*coords[0]+3*(1-t)*t*t*coords[1]+t**3*coords[2]
                else: point=(1-t)**2*start+2*(1-t)*t*coords[0]+t*t*coords[1]
                points.append(point)
            current=coords[-1]
    return np.array(points)

def star():
    def at(r,a):
        return [600+r*math.cos(math.radians(a)),410+r*math.sin(math.radians(a))]
    d='M '+' '.join(map(str,at(280,-90)))
    for i in range(8):
        d+=' Q '+' '.join(map(str,at(280*.38,-90+i*45+22.5)+at(280,-90+(i+1)*45)))
    return d+' Z'

def field(paths):
    # Supersampled mask then a distance field in artwork units.
    img=Image.new('L',(W*2,H*2))
    draw=ImageDraw.Draw(img)
    for path in paths: draw.polygon([tuple(pt) for pt in flatten(path)],fill=255)
    mask=np.array(img.resize((W,H),Image.Resampling.LANCZOS))>127
    return (distance_transform_edt(mask)-distance_transform_edt(~mask))*STEP

start=field([star()]); end=field(shapes)
envelope_paths=['M '+' L '.join(f'{600+190*math.cos(a)} {410+190*math.sin(a)}' for a in np.linspace(0,2*math.pi,100))+' Z']
for shape in shapes:
    pts=flatten(shape)
    hull=pts[ConvexHull(pts).vertices]
    envelope_paths.append('M '+' L '.join(f'{x} {y}' for x,y in hull)+' Z')
envelope=field(envelope_paths)

def pose(t):
    # Expansion and opening overlap, so the intermediate never pauses as a slab.
    # Carry the star's outward motion into the figure envelope immediately.
    # The old smoothstep started at zero speed, creating a second take-off.
    u=min(1,t/.82)
    u=1-(1-u)**2
    expanding=start*(1-u)+envelope*u
    clearance=310*(1-t)**4
    # Smooth the meeting of expanding silhouettes and opening negative space.
    # A hard minimum changes boundary velocity abruptly where the fields meet.
    target=end+clearance
    k=max(.001, 10*math.sin(math.pi*t))
    blend=np.clip(.5+.5*(target-expanding)/k,0,1)
    return target*(1-blend)+expanding*blend-k*blend*(1-blend)

x=np.arange(W)*STEP;y=np.arange(H)*STEP

def simplify(points, tolerance=.85):
    # Iterative RDP. Endpoints repeated by contourpy are split at the midpoint.
    if len(points)<3:return points
    keep=np.zeros(len(points),bool);keep[0]=keep[-1]=True;stack=[(0,len(points)-1)]
    while stack:
        a,b=stack.pop()
        if b-a<2:continue
        v=points[b]-points[a];den=np.dot(v,v)
        delta=points[a+1:b]-points[a]
        if den:
            frac=np.clip(delta@v/den,0,1)
            dist=np.linalg.norm(delta-frac[:,None]*v,axis=1)
        else:dist=np.linalg.norm(delta,axis=1)
        at=int(np.argmax(dist))
        if dist[at]>tolerance:
            i=a+1+at;keep[i]=True;stack.extend([(a,i),(i,b)])
    return points[keep]

frames=[]
for t in np.linspace(0,1,241):
    # A single planar surface. Concavities open by moving the boundary, not by
    # passing control points through one another. Small details arrive last.
    f=gaussian_filter(pose(t), .7)
    paths=contourpy.contour_generator(x=x,y=y,z=f,line_type='Separate').lines(0)
    ds=[]
    for pts in paths:
        if len(pts)<4:continue
        mid=len(pts)//2
        pts=np.vstack([simplify(pts[:mid+1]),simplify(pts[mid:])[1:]])
        # Rounded quadratic joins keep the baked contour from looking polygonal.
        pts=pts[:-1] if np.linalg.norm(pts[0]-pts[-1])<.01 else pts
        if len(pts)<3:continue
        first=(pts[-1]+pts[0])/2
        d=f'M{first[0]:.1f},{first[1]:.1f}'
        for i,pt in enumerate(pts):
            nxt=(pt+pts[(i+1)%len(pts)])/2
            d+=f'Q{pt[0]:.1f},{pt[1]:.1f},{nxt[0]:.1f},{nxt[1]:.1f}'
        ds.append(d+'Z')
    frames.append(''.join(ds))
output=ROOT/'src/components/intro-growth-frames.ts'
output.write_text('// Generated by scripts/design/generate-intro-growth.py. Planar distance-field contours.\nexport const GROWTH_FRAMES: readonly string[] = '+json.dumps(frames,separators=(',',':'))+';\n')
print(f'{len(frames)} growth frames; {output.stat().st_size:,} bytes')
# Static comparison sheet for authoring; final browser QA uses the actual SVG.
sheet=Image.new('RGB',(1200,820*2),(26,26,26))
for n,t in enumerate([0,.2,.4,.6,.8,1]):
    f=gaussian_filter(pose(t), .7)
    arr=np.zeros((H,W,3),dtype=np.uint8);arr[:]=[26,26,26];arr[f>=0]=[245,243,220]
    tile=Image.fromarray(arr).resize((400,410))
    sheet.paste(tile,((n%3)*400,(n//3)*410))
sheet.crop((0,0,1200,820)).save('/Users/keith/Documents/ChatGPT/gift/growth-contact-sheet.png')
