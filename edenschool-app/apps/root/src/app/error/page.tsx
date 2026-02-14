export default function ErrorPage() {
  return (
    <div className="container mt-5 text-center">
      <h3>오류가 발생했습니다</h3>
      <p className="text-muted mt-3">
        요청하신 페이지를 처리하는 중 오류가 발생했습니다.<br />
        잠시 후 다시 시도해 주세요.
      </p>
      <a href="/" className="btn btn-primary mt-3">홈으로</a>
    </div>
  );
}
