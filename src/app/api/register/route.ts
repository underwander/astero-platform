export async function POST(req: Request) {
  void req;
  return Response.json(
    { error: "Самостоятельная регистрация отключена. Обратитесь к менеджеру Astero." },
    { status: 403 }
  );
}
