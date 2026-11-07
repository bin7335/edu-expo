import re,os
R=r'D:/OneDrive - 경상북도교육청/0bin/dev/edu-expo/'
E=R+'extensions/law-link/'
t=open(R+'tools/ext-law-link.tpl.html',encoding='utf-8').read()
rd=lambda f: open(E+f,encoding='utf-8').read().strip()
def put(t,tag,body,c):
    a=f'{c[0]} =={tag}:start=={c[1]}'; b=f'{c[0]} =={tag}:end=={c[1]}'
    i=t.index(a)+len(a); j=t.index(b)
    return t[:i]+'\n'+body+'\n'+t[j:]
t=put(t,'css',rd('popup.css'),('/*',' */'))
t=put(t,'core',rd('law-core.js'),('//',''))
t=put(t,'ui',rd('law-ui.js'),('//',''))
os.makedirs(R+'ext-law-link',exist_ok=True)
open(R+'ext-law-link/index.html','w',encoding='utf-8').write(t)
print('built',len(t))
