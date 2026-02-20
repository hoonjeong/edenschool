import { selectSitePage } from '@edenschool/common/queries/site-config';

interface Block {
  id: string;
  type: 'image' | 'text';
  fileId?: number;
  content?: string;
}

const FOOTER = (
  <div className="footer" style={{ width: '100%', backgroundColor: '#333333', color: 'white', textAlign: 'center', fontSize: '12pt', padding: 16 }}>
    이든배움진학지도보습학원 교육청등록 제5569호 사업자번호 130-92-61827 경기 부천시 소향로 29 (상동, 그린프라자) 503호, 504호 &copy; 이든배움진학지도보습학원 edenschool.kr <br />
    이든배움국어상동2관입시학원 교육청등록 제6380호<br />이든배움국어상동3관입시학원 교육청등록 제6646호<br />이든국어독서교육원논술학원 교육청등록 제6673호<br />이든배움국어상동5관입시학원 교육청등록 제6739호
  </div>
);

export default async function HomePage() {
  let page: { gjsdata: string | null } | null = null;
  try {
    page = await selectSitePage('main');
  } catch {
    // DB not ready — use fallback
  }

  // gjsdata에서 블록 JSON 파싱
  let blocks: Block[] = [];
  if (page?.gjsdata) {
    try {
      const parsed = JSON.parse(page.gjsdata);
      if (Array.isArray(parsed)) blocks = parsed;
    } catch {
      // invalid JSON
    }
  }

  // 블록이 있으면 블록 기반 렌더링
  if (blocks.length > 0) {
    return (
      <>
        <div className="container-fluid px-0" style={{ backgroundColor: 'white' }}>
          {blocks.map((block) => {
            if (block.type === 'image' && block.fileId) {
              return (
                <img
                  key={block.id}
                  src={`/api/file/image/${block.fileId}`}
                  alt=""
                  style={{ width: '100%', display: 'block' }}
                />
              );
            }
            if (block.type === 'text' && block.content) {
              return (
                <div
                  key={block.id}
                  className="eden-container"
                  style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px' }}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              );
            }
            return null;
          })}
        </div>
        {FOOTER}
      </>
    );
  }

  // Fallback: 기존 이미지 나열
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .img-title { position: absolute; text-align: center; left: 0; right: 0; top: 30%; }
        .container-fluid { text-align: center; }
        img { margin: 0 auto; }
        .footer { width: 100%; background-color: #333333; color: white; text-align: center; font-size: 12pt; padding: 16px; }
      `}} />

      <div className="container-fluid px-0">
        <img src="/assets/img/1.jpg" alt="최고의 선생님" className="img-fluid" />
        <img src="/assets/img/2.jpg" alt="차별화된 프로그램" className="img-fluid" />
      </div>
      <div className="container-fluid px-0" style={{ backgroundColor: 'white' }}>
        {['001','002','003','004','005'].map(n => (
          <img key={n} src={`/assets/img/${n}.png`} alt="" className="img-fluid" />
        ))}
      </div>
      <div className="container-fluid px-0" style={{ backgroundColor: 'white' }} id="high">
        {['006','007','008','009','010','011','012','013'].map(n => (
          <img key={n} src={`/assets/img/${n}.png`} alt="" className="img-fluid" />
        ))}
      </div>
      <div className="container-fluid px-0" style={{ backgroundColor: 'white' }} id="middle">
        {['014','015','016','017','018','019','020','028'].map(n => (
          <img key={n} src={`/assets/img/${n}.png`} alt="" className="img-fluid" />
        ))}
      </div>
      {FOOTER}
    </>
  );
}
