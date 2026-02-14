export function SiteHeader() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        html { font-size: 14px; }
        .maintop { text-align: center; padding: 10px; }
        @media screen and (min-width:601px) {
          .maintitle { font-family: Black Han Sans; font-size: 2.5em; }
          .logo { width: 80px; }
        }
        @media screen and (max-width:600px) {
          .maintitle { font-family: Black Han Sans; font-size: 2em; }
          .logo { width: 70px; }
        }
        td { border-spacing: 0px; border-style: none; padding: 0px; }
        li { padding-right: 5px; padding-left: 5px; }
      `}} />

      <div className="maintop" style={{ cursor: 'pointer' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <table style={{ margin: '0 auto', cursor: 'pointer' }}>
            <tbody>
              <tr>
                <td rowSpan={2} valign="top" style={{ paddingRight: '10px' }}>
                  <img className="logo" src="/assets/img/logo.jpg" alt="로고" />
                </td>
                <td valign="bottom">
                  <div className="subtitle text-info">참되고 선한 가르침</div>
                </td>
              </tr>
              <tr>
                <td valign="bottom">
                  <div className="maintitle text-info">이든배움국어학원</div>
                </td>
              </tr>
            </tbody>
          </table>
        </a>
      </div>
    </>
  );
}
