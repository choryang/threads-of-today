"""내 하루 마을 지도 v2: 2800x4200. 섬을 넓히고 구역마다 자리(slot)를 장애물을 피해 계산한다.
출력: public/village/map.svg, scripts/village-layout.json (구역 이름표·범위·자리·여분 자리)
layout의 값은 shared/data/village.ts에 옮겨 적는다(앱은 json을 읽지 않는다). 실행: python scripts/gen_map2.py"""
import random, os, json, math
W,H=2800,4200
LN='#2A2A35'
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(D)
def L(w=6): return f'stroke="{LN}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'
o=[]; a=o.append
OBS=[]   # ('c',x,y,r) ('r',x0,y0,x1,y1) ('l',pts,w)
rnd=random.Random(11)

# ── 섬 모양 ──────────────────────────────
ISLAND=[(220,260),(800,150),(1500,210),(2200,150),(2620,320),(2690,900),(2600,1500),(2650,2000),(2480,2230),
        (2200,2300),(2110,2700),(2150,3150),(2450,3300),(2620,3550),(2500,3920),(1800,4040),(1000,4010),(400,3960),
        (170,3600),(140,2900),(210,2200),(120,1500),(170,800)]
def catmull(pts,steps=14):
    out=[]; n=len(pts)
    for i in range(n):
        p0,p1,p2,p3=pts[i-1],pts[i],pts[(i+1)%n],pts[(i+2)%n]
        for s in range(steps):
            t=s/steps; t2=t*t; t3=t2*t
            x=0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3)
            y=0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
            out.append((x,y))
    return out
POLY=catmull(ISLAND)
def path_of(poly,dx=0,dy=0,k=1.0,cx=1400,cy=2100):
    pts=[(cx+(x-cx)*k+dx, cy+(y-cy)*k+dy) for x,y in poly]
    return 'M'+' L'.join(f'{x:.0f} {y:.0f}' for x,y in pts)+' Z'
def inside(x,y,poly=POLY):
    c=False; n=len(poly)
    for i in range(n):
        x1,y1=poly[i]; x2,y2=poly[(i+1)%n]
        if (y1>y)!=(y2>y) and x < (x2-x1)*(y-y1)/(y2-y1)+x1: c=not c
    return c
def dist_to_edge(x,y,poly=POLY):
    return min(math.hypot(x-px,y-py) for px,py in poly[::2])

a(f'<rect width="{W}" height="{H}" fill="#7FC3DE"/>')
for i in range(160):
    x,y=rnd.uniform(0,W),rnd.uniform(0,H)
    a(f'<path d="M{x:.0f} {y:.0f} q12 -8 24 0 q12 8 24 0" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".45"/>')
# 작은 섬 두 개 (바깥 바다)
for cx,cy,r in [(2560,120,60),(90,4100,70)]:
    a(f'<ellipse cx="{cx}" cy="{cy+10}" rx="{r}" ry="{r*.6}" fill="#6E9B58" {L(5)}/><ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r*.6}" fill="#B7DB97" {L(5)}/>')
LAND=path_of(POLY)
a(f'<path d="{LAND}" transform="translate(0 30)" fill="#6E9B58" {L(7)}/>')
a(f'<path d="{LAND}" fill="#F1E3BF" {L(7)}/>')
a(f'<path d="{path_of(POLY,k=.965)}" fill="#B7DB97"/>')
GRASS_EDGE=[(1400+(x-1400)*.965, 2100+(y-2100)*.965) for x,y in POLY]
for i in range(700):
    x,y=rnd.uniform(200,2600),rnd.uniform(220,3980)
    if inside(x,y,GRASS_EDGE): a(f'<path d="M{x:.0f} {y:.0f} l4 -10 l4 10" fill="none" stroke="#9CC97E" stroke-width="4" stroke-linecap="round"/>')

# ── 길 (공급망 여정의 길: 농장 → 공장 → 항구 → 우리 동네, 광산 → 공장) ──
ROADS=[
 [(700,900),(900,1150),(1150,1350),(1500,1500),(1800,1700)],          # 커피 언덕 → 공장 거리
 [(700,2000),(1000,1850),(1400,1750),(1800,1700)],                    # 목장·논 → 공장 거리
 [(2000,950),(1950,1150),(1850,1450),(1800,1700)],                    # 광산 → 공장
 [(1800,1700),(1850,2000),(1800,2350),(1750,2700),(1900,2900)],       # 공장 → 항구
 [(1750,2700),(1450,2950),(1150,3150),(850,3350),(600,3500)],         # 항구 → 우리 동네
]
def smooth_d(pts):
    d=f'M{pts[0][0]} {pts[0][1]}'
    for i in range(1,len(pts)-1):
        mx=(pts[i][0]+pts[i+1][0])/2; my=(pts[i][1]+pts[i+1][1])/2
        d+=f' Q{pts[i][0]} {pts[i][1]} {mx:.0f} {my:.0f}'
    d+=f' L{pts[-1][0]} {pts[-1][1]}'
    return d
for r in ROADS: a(f'<path d="{smooth_d(r)}" fill="none" stroke="{LN}" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>')
for r in ROADS: a(f'<path d="{smooth_d(r)}" fill="none" stroke="#EAD9B0" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>')
for r in ROADS: a(f'<path d="{smooth_d(r)}" fill="none" stroke="#D9C493" stroke-width="5" stroke-dasharray="4 30" stroke-linecap="round"/>')
for r in ROADS: OBS.append(('l',r,40))

# ── 그림 도구 ───────────────────────────
def tree(x,y,s=1,c='#5E9E4E',fruit=None,obs=True):
    r=46*s
    t=f'<rect x="{x-8*s:.0f}" y="{y-30*s:.0f}" width="{16*s:.0f}" height="{36*s:.0f}" rx="5" fill="#8B5E3C" {L(5)}/>'
    t+=f'<circle cx="{x}" cy="{y-30*s-r*.7:.0f}" r="{r:.0f}" fill="{c}" {L(6)}/>'
    t+=f'<path d="M{x-r*.5:.0f} {y-30*s-r*1.0:.0f} q{r*.25:.0f} {-r*.25:.0f} {r*.55:.0f} {-r*.15:.0f}" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".4"/>'
    if fruit:
        for dx,dy in [(-.4,-.6),(.35,-.9),(.1,-.35),(-.1,-1.15),(.5,-.45)]:
            t+=f'<circle cx="{x+dx*r:.0f}" cy="{y-30*s-r*.7+(dy+.7)*r:.0f}" r="{8*s:.0f}" fill="{fruit}" {L(3)}/>'
    if obs: OBS.append(('c',x,y-10,30*s))
    return t
def coffee(x,y):
    OBS.append(('c',x,y,38))
    t=f'<ellipse cx="{x}" cy="{y}" rx="40" ry="30" fill="#4E8A42" {L(5)}/>'
    for dx,dy in [(-16,-8),(10,-14),(18,6),(-6,8)]: t+=f'<circle cx="{x+dx}" cy="{y+dy}" r="6" fill="#D2463A" {L(2.5)}/>'
    return t
def banana_plant(x,y):
    OBS.append(('c',x,y-10,26))
    t=f'<path d="M{x-7} {y} V{y-110} H{x+7} V{y} Z" fill="#7FA66B" {L(5)}/>'
    for ang in [-60,-20,25,65]:
        t+=f'<path d="M{x} {y-110} q0 -60 70 -40 q-30 10 -70 40 Z" fill="#6CB65A" {L(5)} transform="rotate({ang} {x} {y-110})"/>'
    t+=f'<path d="M{x+8} {y-96} q20 6 18 30 q-14 -4 -18 -30 Z" fill="#F2C14E" {L(4)}/>'
    return t
def cacao_tree(x,y):
    t=tree(x,y,1.05,'#4F8E48')
    for dx,dy in [(-14,-40),(14,-30)]: t+=f'<ellipse cx="{x+dx}" cy="{y+dy}" rx="9" ry="15" fill="#E08A3A" {L(3.5)}/>'
    return t
def house(cx,by,w,h,wall,roof,door='#8B5E3C',awning=None,sign=''):
    x=cx-w/2
    OBS.append(('r',x-14,by-h,x+w+14,by+12))
    t=f'<rect x="{x+10:.0f}" y="{by-h+18:.0f}" width="{w:.0f}" height="{h-10:.0f}" rx="6" fill="#00000022"/>'
    t+=f'<rect x="{x:.0f}" y="{by-h:.0f}" width="{w:.0f}" height="{h:.0f}" rx="6" fill="{wall}" {L(6)}/>'
    t+=f'<path d="M{x-18:.0f} {by-h+6:.0f} L{cx:.0f} {by-h-w*.42:.0f} L{x+w+18:.0f} {by-h+6:.0f} Z" fill="{roof}" {L(6)}/>'
    t+=f'<rect x="{cx-18:.0f}" y="{by-56:.0f}" width="36" height="56" rx="5" fill="{door}" {L(5)}/>'
    for wx in [x+w*.18, x+w*.82-34]: t+=f'<rect x="{wx:.0f}" y="{by-h+26:.0f}" width="34" height="30" rx="4" fill="#CDE7F3" {L(4)}/>'
    if awning:
        for i in range(6): t+=f'<path d="M{x+i*w/6:.0f} {by-h+4:.0f} h{w/6:.0f} v20 q{-w/12:.0f} 12 {-w/6:.0f} 0 Z" fill="{awning if i%2==0 else "#FFFFFF"}" {L(4)}/>'
    return t+sign
def factory(cx,by,w,h,wall,roof):
    x=cx-w/2
    OBS.append(('r',x-14,by-h-30,x+w+14,by+12))
    t=f'<rect x="{x:.0f}" y="{by-h:.0f}" width="{w:.0f}" height="{h:.0f}" rx="4" fill="{wall}" {L(6)}/>'
    n=4; sw=w/n
    for i in range(n): t+=f'<path d="M{x+i*sw:.0f} {by-h:.0f} L{x+i*sw:.0f} {by-h-40:.0f} L{x+(i+1)*sw:.0f} {by-h:.0f} Z" fill="{roof}" {L(5)}/>'
    for i in range(n): t+=f'<rect x="{x+i*sw+sw*.25:.0f}" y="{by-h+30:.0f}" width="{sw*.5:.0f}" height="26" rx="3" fill="#CDE7F3" {L(4)}/>'
    t+=f'<rect x="{cx-30:.0f}" y="{by-60:.0f}" width="60" height="60" fill="#8C9AAD" {L(5)}/><path d="M{cx-30} {by-40} h60 M{cx-30} {by-20} h60" stroke="{LN}" stroke-width="3"/>'
    return t
def chimney(x,by,h=130):
    OBS.append(('r',x-20,by-h,x+54,by))
    t=f'<rect x="{x}" y="{by-h}" width="34" height="{h}" fill="#B9B2A4" {L(6)}/>'
    for (dx,dy,r) in [(20,-20,22),(45,-50,28),(80,-80,34)]: t+=f'<circle cx="{x+dx}" cy="{by-h+dy}" r="{r}" fill="#FFFFFF" {L(4)}/>'
    return t
def fence(x0,y0,x1,y1):
    t=f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="#C8E3A8" stroke="#A8743E" stroke-width="7" stroke-dasharray="2 26" stroke-linecap="round"/>'
    t+=f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="none" stroke="#A8743E" stroke-width="4"/>'
    return t
def paddy(x0,y0,x1,y1):
    OBS.append(('r',x0,y0,x1,y1+10))
    t=f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="10" fill="#9FD3C7" {L(5)}/>'
    for yy in range(y0+20,y1-10,26):
        for xx in range(x0+20,x1-10,30): t+=f'<path d="M{xx} {yy} l-4 -12 M{xx} {yy} l4 -12 M{xx} {yy} v-14" stroke="#5E9E4E" stroke-width="3" stroke-linecap="round"/>'
    return t
def field(x0,y0,x1,y1,c='#E8C063',row='#C9A04A'):
    OBS.append(('r',x0,y0,x1,y1+10))
    t=f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="10" fill="{c}" {L(5)}/>'
    for yy in range(y0+18,y1-6,22): t+=f'<path d="M{x0+14} {yy} H{x1-14}" stroke="{row}" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 8"/>'
    return t
def cabbage_field(x0,y0,x1,y1):
    OBS.append(('r',x0,y0,x1,y1+10))
    t=f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="10" fill="#C9A882" {L(5)}/>'
    for yy in range(y0+28,y1-10,40):
        for xx in range(x0+28,x1-10,44): t+=f'<circle cx="{xx}" cy="{yy}" r="14" fill="#B8E0A0" {L(3)}/>'
    return t
def derrick(x,by):
    OBS.append(('r',x-60,by-200,x+60,by+10))
    t=f'<path d="M{x-50} {by} L{x} {by-200} L{x+50} {by} M{x-35} {by-60} H{x+35} M{x-20} {by-120} H{x+20}" fill="none" stroke="{LN}" stroke-width="14" stroke-linejoin="round" stroke-linecap="round"/>'
    t+=f'<path d="M{x-50} {by} L{x} {by-200} L{x+50} {by} M{x-35} {by-60} H{x+35} M{x-20} {by-120} H{x+20}" fill="none" stroke="#6A7A8C" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>'
    t+=f'<rect x="{x-70}" y="{by-6}" width="140" height="20" rx="4" fill="#3A3340" {L(5)}/>'
    return t
def boat(x,y,c='#E0705F'):
    t=f'<path d="M{x-80} {y} H{x+80} L{x+60} {y+40} H{x-60} Z" fill="{c}" {L(6)}/>'
    t+=f'<rect x="{x-20}" y="{y-40}" width="40" height="40" rx="4" fill="#F3F1EA" {L(5)}/><path d="M{x+30} {y} V{y-90} L{x+70} {y-20}" fill="none" stroke="{LN}" stroke-width="6" stroke-linejoin="round"/>'
    return t

# ── 커피 언덕 (농장: 커피·카카오·바나나, 과수원·논·채소밭·목장) ──
for cx,cy,rx,ry in [(520,520,330,200),(1000,450,300,170),(620,980,420,190)]:
    a(f'<ellipse cx="{cx}" cy="{cy+16}" rx="{rx}" ry="{ry}" fill="#8DBE70"/>')
    a(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#A6D187" {L(5)}/>')
for x,y in [(330,440),(460,380),(320,600),(600,420)]: a(cacao_tree(x,y))
for y in [920,1000,1080]:
    for x in range(330,920,95): a(coffee(x+(30 if y==1000 else 0),y))
for x,y in [(940,420),(1060,380),(1100,520),(980,560)]: a(banana_plant(x,y))
a(paddy(300,1450,640,1640)); a(paddy(700,1450,1000,1640))
a(cabbage_field(300,1760,620,1960))
for x,y in [(760,1820),(860,1780),(960,1840),(810,1930),(930,1960)]: a(tree(x,y,.9,'#5E9E4E','#D2463A'))   # 과수원
a(fence(260,2120,760,2420)); a(house(900,2330,150,110,'#E0705F','#8B5E3C'))   # 목장과 헛간
for x,y in [(380,1300),(1180,800),(240,1180),(1150,1150),(1150,2000),(1100,2450),(260,2560)]: a(tree(x,y,1.05))

# ── 광산 마을 ──────────────────────────
a(f'<path d="M1600 920 L1800 480 L1900 600 L2060 300 L2300 920 Z" fill="#B39A82" {L(7)}/>')
a(f'<path d="M2060 300 L2120 430 L2085 418 L2050 460 L2015 400 Z" fill="#F3F1EA" {L(5)}/>')
a(f'<path d="M1800 480 L1835 560 L1805 552 L1775 540 Z" fill="#F3F1EA" {L(5)}/>')
a(f'<path d="M1680 920 L1820 650 M2220 920 L2120 650" stroke="#8F7760" stroke-width="10" stroke-linecap="round"/>')
OBS.append(('r',1600,300,2300,930))
a(f'<path d="M1900 920 V810 Q1960 740 2020 810 V920 Z" fill="#3A3340" {L(7)}/>')
a(f'<path d="M1888 920 V800 H2032 V920" fill="none" stroke="#8B5E3C" stroke-width="14" stroke-linejoin="round"/>')
a(f'<path d="M1882 794 H2038" stroke="{LN}" stroke-width="18" stroke-linecap="round"/><path d="M1882 794 H2038" stroke="#A8743E" stroke-width="10" stroke-linecap="round"/>')
a(f'<path d="M1960 930 Q2040 1020 2200 1040" fill="none" stroke="#6A5A4A" stroke-width="22" stroke-linecap="round"/><path d="M1960 930 Q2040 1020 2200 1040" fill="none" stroke="#C9B79E" stroke-width="5" stroke-dasharray="3 14"/>')
OBS.append(('l',[(1960,930),(2080,1010),(2200,1040)],24))
a(f'<path d="M2160 990 H2240 L2232 1038 H2168 Z" fill="#6A7A8C" {L(6)}/><circle cx="2180" cy="1044" r="10" fill="{LN}"/><circle cx="2220" cy="1044" r="10" fill="{LN}"/>')
for x,y,c in [(2180,982,'#4A6A8C'),(2202,976,'#7A8FA6'),(2224,984,'#4A6A8C')]: a(f'<circle cx="{x}" cy="{y}" r="13" fill="{c}" {L(4)}/>')
a(derrick(2420,700)); a(derrick(2500,1000))
for x,y in [(1560,300),(2400,330),(1700,1080)]: a(tree(x,y,.9,'#4F8E48'))

# ── 공장 거리 ──────────────────────────
a(house(1520,1330,230,150,'#F3F1EA','#E0705F'))                  # 제분소
a(f'<circle cx="1520" cy="1230" r="24" fill="#F2C14E" {L(5)}/><path d="M1520 1216 v28 M1512 1224 l8 6 l8 -6 M1512 1234 l8 6 l8 -6" fill="none" stroke="{LN}" stroke-width="3.5" stroke-linecap="round"/>')
a(chimney(1600,1180))
a(house(1880,1330,180,130,'#DDEBF7','#5B6B85'))                   # 연구소
a(f'<circle cx="1880" cy="1250" r="22" fill="#FFFFFF" {L(5)}/><path d="M1874 1238 v10 l-8 14 h28 l-8 -14 v-10" fill="#9ED9C0" {L(3)}/>')
a(factory(2250,1350,300,150,'#E9E3D3','#8C9AAD')); a(chimney(2380,1200,150))
a(factory(1420,1950,280,140,'#F6E7C8','#E0705F'))
a(factory(2200,1880,300,150,'#DDEBF7','#5B6B85'))
a(house(1700,2050,200,120,'#C8D6E5','#3B4A63'))                   # 창고
for x,y in [(2000,1560),(1300,1620),(2450,1600),(2480,2050),(1250,2200)]: a(tree(x,y,.95))

# ── 항구 (바다 안쪽 만) ─────────────────
a(f'<path d="M1950 2500 H2330 V2560 H1950 Z" fill="#C8955A" {L(6)}/>')
for x in range(1980,2330,40): a(f'<path d="M{x} 2504 V2556" stroke="#A8743E" stroke-width="4"/>')
a(f'<path d="M1980 3000 H2300 V3060 H1980 Z" fill="#C8955A" {L(6)}/>')
for x in range(2010,2300,40): a(f'<path d="M{x} 3004 V3056" stroke="#A8743E" stroke-width="4"/>')
DOCKS=[(1950,2500,2330,2560),(1980,3000,2300,3060)]
CR='M1880 2560 V2240 M1930 2560 V2240 M1880 2310 L1930 2370 M1930 2310 L1880 2370 M1880 2430 L1930 2490 M1930 2430 L1880 2490'
a(f'<path d="{CR}" fill="none" stroke="{LN}" stroke-width="14" stroke-linecap="round"/><path d="{CR}" fill="none" stroke="#E0705F" stroke-width="7" stroke-linecap="round"/>')
a(f'<rect x="1860" y="2220" width="330" height="30" rx="6" fill="#E0705F" {L(6)}/><rect x="1870" y="2250" width="70" height="50" rx="6" fill="#F3F1EA" {L(5)}/>')
a(f'<path d="M2140 2250 V2340" stroke="{LN}" stroke-width="4"/><rect x="2110" y="2340" width="60" height="40" rx="4" fill="#7FC3DE" {L(5)}/>')
OBS.append(('r',1850,2220,1950,2570))
# 컨테이너선
a(f'<path d="M2280 2680 H2600 L2570 2760 Q2440 2785 2310 2760 Z" fill="#3B4A63" {L(7)}/><path d="M2295 2720 H2585" stroke="#E0705F" stroke-width="8"/>')
for i,(x,c) in enumerate([(2310,'#F2C14E'),(2370,'#E0705F'),(2430,'#7FC3DE'),(2340,'#7FA66B'),(2400,'#F2C14E')]):
    y=2630 if i<3 else 2580
    a(f'<rect x="{x}" y="{y}" width="58" height="50" rx="4" fill="{c}" {L(5)}/>')
a(f'<rect x="2500" y="2600" width="60" height="80" rx="6" fill="#F3F1EA" {L(6)}/>')
a(boat(2380,3180,'#7FA66B')); a(boat(2250,3420,'#F2C14E'))
for (x,y,c) in [(1700,2600,'#F2C14E'),(1760,2600,'#E0705F'),(1730,2560,'#7FC3DE')]: a(f'<rect x="{x}" y="{y}" width="56" height="44" rx="4" fill="{c}" {L(5)}/>')
OBS.append(('r',1690,2550,1825,2650))
a(house(1650,3200,200,120,'#F3F1EA','#7FC3DE'))                   # 항만 사무소
for x,y in [(1560,2450),(1600,2850),(1580,3450)]: a(tree(x,y,.9))

# ── 우리 동네 ──────────────────────────
a(house(420,3820,190,140,'#FFF4D6','#F2C14E',door='#E0705F'))     # 내 집
a(f'<path d="M420 3660 q-10 -14 -20 -4 q-8 10 20 30 q28 -20 20 -30 q-10 -10 -20 4 Z" fill="#E0705F" {L(3.5)}/>')
a(house(820,3560,210,140,'#FFFFFF','#B8352B',awning='#E0705F'))   # 치킨집
a(house(1180,3420,190,130,'#FFFFFF','#4E9A4C',awning='#4E9A4C'))  # 편의점
a(house(560,3240,190,130,'#F6E7C8','#8B5E3C',awning='#F2C14E'))   # 카페
a(house(1300,3800,230,130,'#FFFFFF','#E08A3A',awning='#E08A3A'))  # 시장
a(house(900,3900,170,120,'#EAF2E3','#5B6B85'))
for x,y in [(640,3490),(676,3490),(658,3460)]: a(f'<rect x="{x-17}" y="{y-28}" width="34" height="28" rx="4" fill="#D3A06A" {L(4)}/>')
OBS.append(('r',620,3430,700,3495))
for x,y,s in [(300,3050,1),(260,3400,1.1),(1600,3700,1),(1000,3700,.9),(700,3950,.9),(1500,3300,.9),(380,2800,1)]: a(tree(x,y,s))

# 꽃 (장애물 아님)
for i in range(260):
    x,y=rnd.uniform(220,2550),rnd.uniform(260,3950)
    if inside(x,y,GRASS_EDGE):
        c=rnd.choice(['#FFFFFF','#F9B9C9','#FFE08A','#D6C4F2'])
        a(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="7" fill="{c}" stroke="{LN}" stroke-width="2.5"/>')

svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{"".join(o)}</svg>'
open(os.path.join(ROOT,'public','village','map.svg'),'w',encoding='utf-8').write(svg)

# ── 자리 계산 ──────────────────────────
def seg_dist(px,py,x1,y1,x2,y2):
    dx,dy=x2-x1,y2-y1; L2=dx*dx+dy*dy
    t=0 if L2==0 else max(0,min(1,((px-x1)*dx+(py-y1)*dy)/L2))
    return math.hypot(px-(x1+t*dx),py-(y1+t*dy))
def road_samples(pts):
    # 부드러운 길을 꺾은선으로 근사
    out=[]
    for i in range(len(pts)-1): out.append((pts[i],pts[i+1]))
    return out
def blocked(x,y):
    # 발끝 둘레(아랫몸) 상자: x±45, y-70..y+8
    bx0,bx1,by0,by1=x-45,x+45,y-70,y+8
    for ob in OBS:
        if ob[0]=='c':
            _,cx,cy,r=ob
            nx=min(max(cx,bx0),bx1); ny=min(max(cy,by0),by1)
            if math.hypot(cx-nx,cy-ny)<r: return True
        elif ob[0]=='r':
            _,x0,y0,x1,y1=ob
            if bx0<x1 and bx1>x0 and by0<y1 and by1>y0: return True
        else:
            _,pts,w=ob
            for (p,q) in road_samples(pts):
                for sx,sy in [(x,y),(x-45,y),(x+45,y),(x,y-60)]:
                    if seg_dist(sx,sy,p[0],p[1],q[0],q[1])<w: return True
    return False
def on_land(x,y):
    if any(x0<=x<=x1 and y0<=y<=y1+5 for x0,y0,x1,y1 in DOCKS): return True
    return inside(x,y,GRASS_EDGE) and inside(x-45,y,GRASS_EDGE) and inside(x+45,y,GRASS_EDGE) and inside(x,y-150,GRASS_EDGE)
ZONES=[
 ('farm','커피 언덕',(250,170),(200,250,1100,2650),76),
 ('mine','광산 마을',(1650,1000),(1450,200,2650,1150),7),
 ('factory','공장 거리',(1300,1120),(1100,1100,2650,2600),74),
 ('port','항구',(1960,2420),(1300,2600,2500,3800),49),
 ('town','우리 집',(330,3870),(200,2900,1300,4000),18),
]
taken=[]
def far(x,y):
    return all(abs(x-tx)>=90 or abs(y-ty)>=130 for tx,ty in taken)
layout={'MAP_W':W,'MAP_H':H,'zones':[]}
for zid,name,label,(x0,y0,x1,y1),need in ZONES:
    cands=[(x,y) for x in range(x0,x1,30) for y in range(y0,y1,30) if on_land(x,y) and not blocked(x,y)]
    cx,cy=(x0+x1)/2,(y0+y1)/2
    rr=random.Random(zid)
    cands.sort(key=lambda p:(p[1],p[0]))
    slots=[]
    for x,y in cands:
        if far(x,y): slots.append((x,y)); taken.append((x,y))
    # 앞(아래)쪽 사람이 나중에 그려지도록 y 순서
    slots.sort(key=lambda p:(math.hypot(p[0]-cx,p[1]-cy)))
    rest=[p for p in cands if p not in slots]
    rest.sort(key=lambda p:math.hypot(p[0]-cx,p[1]-cy))
    layout['zones'].append({'id':zid,'name':name,'label':list(label),'bounds':[x0,y0,x1,y1],'need':need,'slots':[list(p) for p in slots],'overflow':[list(p) for p in rest[:120]]})
    print(zid,'need',need,'slots',len(slots))
layout['HOME_POINT']={'x':700,'y':3500,'scale':0.6}
json.dump(layout,open(os.path.join(D,'village-layout.json'),'w',encoding='utf-8'),ensure_ascii=False)
