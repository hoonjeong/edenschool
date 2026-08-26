import './class-video.css';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const metadata = {
  title: '수업 소개영상 | 이든배움국어학원',
  description:
    '이든배움국어학원 원장님·학교별 전임 선생님이 직접 소개하는 수업 영상입니다. 정명고·부명고·상일고·상동고·송내고 수업 소개를 영상으로 확인하세요.',
};

interface VideoItem {
  /** 유튜브 embed 파라미터까지 포함한 전체 src */
  src: string;
  /** 영상 제목(학원 소개 / 학교 수업 소개) */
  title: string;
  /** 담당 선생님 */
  teacher: string;
}

const FEATURE_VIDEO: VideoItem = {
  src: 'https://www.youtube.com/embed/vKMEGJY9yuw?si=HpeHt07Ja3CT0_YN',
  title: '이든배움국어학원 소개',
  teacher: '서효정 원장님',
};

const SCHOOL_VIDEOS: VideoItem[] = [
  {
    src: 'https://www.youtube.com/embed/V6XhOilqEAc?si=v8g6W02_W9uxu4JN',
    title: '정명고 수업 소개',
    teacher: '박정영 선생님',
  },
  {
    src: 'https://www.youtube.com/embed/KAuxNCdOvyo?si=mC0nTxdBeDm0DRsy',
    title: '부명고 수업 소개',
    teacher: '박옥선 선생님',
  },
  {
    src: 'https://www.youtube.com/embed/9Zb8ABMguPU?si=KS80hPeKNmPMoz3i',
    title: '상일고 수업 소개',
    teacher: '권지영 선생님',
  },
  {
    src: 'https://www.youtube.com/embed/5w0ScHhPkw4?si=kA5biNF3T813lGji',
    title: '상동고 수업 소개',
    teacher: '이창완 선생님',
  },
  {
    src: 'https://www.youtube.com/embed/xZE5bxfvp20?si=J4lul713qlt5nvDK',
    title: '송내고 수업 소개',
    teacher: '이우용 선생님',
  },
];

function VideoCard({ video, feature = false }: { video: VideoItem; feature?: boolean }) {
  return (
    <div className={`cv-card${feature ? ' cv-card-feature' : ''}`}>
      <div className="cv-frame">
        <iframe
          src={video.src}
          title={`${video.title} - ${video.teacher}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <div className="cv-card-body">
        <h2 className="cv-card-title">{video.title}</h2>
        <p className="cv-card-teacher">{video.teacher}</p>
      </div>
    </div>
  );
}

export default async function ClassVideoPage() {
  const site = await getSiteUrl();

  // 검색엔진/AI 검색용 구조화 데이터 (영상 목록)
  const allVideos = [FEATURE_VIDEO, ...SCHOOL_VIDEOS];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `수업 소개영상 - ${SITE_NAME}`,
    url: `${site}/class-video`,
    itemListElement: allVideos.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${v.title} - ${v.teacher}`,
      url: v.src,
    })),
  };

  return (
    <div className="cv-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="cv-inner">
        <h1 className="cv-page-title">수업 소개영상</h1>
        <p className="cv-page-desc">
          원장님과 학교별 전임 선생님이 직접 수업을 소개합니다.
        </p>

        <VideoCard video={FEATURE_VIDEO} feature />

        <h2 className="cv-group-title">학교별 수업 소개</h2>
        <div className="cv-grid">
          {SCHOOL_VIDEOS.map((v) => (
            <VideoCard key={v.src} video={v} />
          ))}
        </div>
      </div>
    </div>
  );
}
