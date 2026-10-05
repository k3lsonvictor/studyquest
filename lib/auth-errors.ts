export function authErrorMessage(
  error: { code?: string; status?: number },
  intent: "signup" | "login",
) {
  switch (error.code) {
    case "over_email_send_rate_limit":
      return "O limite de envio de e-mails foi atingido. Aguarde antes de tentar novamente. Se o problema persistir, o responsável pelo aplicativo precisa revisar o serviço de e-mail.";
    case "over_request_rate_limit":
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.";
    case "email_address_not_authorized":
      return "O serviço de e-mail ainda não está autorizado a enviar para este endereço. O responsável pelo aplicativo precisa configurar o envio de e-mails.";
    case "email_not_confirmed":
      return "Seu e-mail ainda não foi confirmado. Confira a caixa de entrada e o spam e abra o link de confirmação.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "O cadastro por e-mail está desativado no momento.";
    case "weak_password":
      return "A senha não atende aos requisitos de segurança. Escolha uma senha mais forte.";
    case "email_address_invalid":
      return "Confira o endereço de e-mail informado.";
    case "user_already_exists":
    case "email_exists":
      return "Não foi possível cadastrar este e-mail. Se você já tem uma conta, tente entrar com sua senha.";
  }
  if (error.status === 429)
    return "Muitas tentativas ou limite de envio atingido. Aguarde antes de tentar novamente.";
  if (error.status && error.status >= 500)
    return "O serviço de autenticação não conseguiu concluir a solicitação. Tente mais tarde; se persistir, informe o responsável pelo aplicativo.";
  return intent === "signup"
    ? "Não foi possível criar a conta. Confira os dados ou tente entrar."
    : "E-mail ou senha inválidos. Confira os dados e tente novamente.";
}
