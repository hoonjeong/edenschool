import { selectClassDisplayListActive } from '@edenschool/common/queries/site-config';

export default async function ClassInfoPage() {
  let items: any[] = [];
  try {
    items = await selectClassDisplayListActive();
  } catch {
    // DB not ready
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .class-info-container { max-width: 1100px; margin: 0 auto; padding: 32px 16px; }
        .class-info-title { text-align: center; font-size: 28px; font-weight: 700; color: #1e293b; margin-bottom: 32px; }
        .class-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .class-info-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; transition: transform 0.2s; }
        .class-info-card:hover { transform: translateY(-2px); }
        .class-info-card-header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; padding: 20px; }
        .class-info-card-header h3 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
        .class-info-card-header .class-time { font-size: 14px; opacity: 0.9; }
        .class-info-card-body { padding: 20px; }
        .class-info-card-body .teacher-img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #e2e8f0; margin-bottom: 12px; }
        .class-info-section { margin-bottom: 16px; }
        .class-info-section-title { font-size: 13px; font-weight: 600; color: #3b82f6; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .class-info-section-content { font-size: 14px; color: #475569; line-height: 1.6; white-space: pre-wrap; }
        .class-info-empty { text-align: center; padding: 60px 16px; color: #94a3b8; font-size: 16px; }
      `}} />

      <div className="class-info-container">
        <h1 className="class-info-title">수강반 안내</h1>

        {items.length === 0 ? (
          <div className="class-info-empty">등록된 수강반 정보가 없습니다.</div>
        ) : (
          <div className="class-info-grid">
            {items.map((item) => (
              <div key={item.id} className="class-info-card">
                <div className="class-info-card-header">
                  <h3>{item.class_name || `수강반 #${item.class_id}`}</h3>
                  {item.class_day && (
                    <div className="class-time">
                      {item.class_day} {item.class_hour}:{item.class_minute === '0' ? '00' : item.class_minute}
                    </div>
                  )}
                </div>
                <div className="class-info-card-body">
                  {item.teacher_image_file_id && (
                    <img
                      src={`/api/file/image/${item.teacher_image_file_id}`}
                      alt="선생님"
                      className="teacher-img"
                    />
                  )}

                  {item.description && (
                    <div className="class-info-section">
                      <div className="class-info-section-title">수강반 정보</div>
                      <div className="class-info-section-content">{item.description}</div>
                    </div>
                  )}

                  {item.progress_info && (
                    <div className="class-info-section">
                      <div className="class-info-section-title">수업 진도 현황</div>
                      <div className="class-info-section-content">{item.progress_info}</div>
                    </div>
                  )}

                  {item.clinic_info && (
                    <div className="class-info-section">
                      <div className="class-info-section-title">클리닉 수업 진도 현황</div>
                      <div className="class-info-section-content">{item.clinic_info}</div>
                    </div>
                  )}

                  {item.introduction && (
                    <div className="class-info-section">
                      <div className="class-info-section-title">반 소개</div>
                      <div className="class-info-section-content">{item.introduction}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
