export default async function HomePage() {
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
      <div className="footer">
        이든배움진학지도보습학원 교육청등록 제5569호 사업자번호 130-92-61827 경기 부천시 소향로 29 (상동, 그린프라자) 503호, 504호 &copy; 이든배움진학지도보습학원 edenschool.kr <br />
        이든배움국어상동2관입시학원 교육청등록 제6380호<br />이든배움국어상동3관입시학원 교육청등록 제6646호<br />이든국어독서교육원논술학원 교육청등록 제6673호<br />이든배움국어상동5관입시학원 교육청등록 제6739호
      </div>
    </>
  );
}
