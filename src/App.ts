const SHEET_NAME = "フォームの回答 1"; // 対象のシート名
const NAME_COLUMN = 3; // 申請者名の列番号
const EMAIL_COLUMN = 2; // メールアドレスの列番号
const APPROVAL_COLUMN = 8; // 承認チェックボックスの列番号
const STATUS_COLUMN = 7; // 処理ステータスを書き込む列番号

// --- .envから読み込む秘密情報 ---
const DISCORD_BOT_TOKEN: string = process.env.DISCORD_BOT_TOKEN || "";
const DISCORD_CHANNEL_ID: string = process.env.DISCORD_CHANNEL_ID || "";

export const App = (e: GoogleAppsScript.Events.SheetsOnEdit) => {
  const range = e.range;
  const sheet = range.getSheet();

  // 変更が承認列のチェックボックスで、かつ対象シートの場合のみ処理を続行
  if (
    sheet.getName() !== SHEET_NAME ||
    range.getColumn() !== APPROVAL_COLUMN ||
    range.getValue() !== true
  ) {
    console.log(`シート名: ${sheet.getName()}, 列番号: ${range.getColumn()}`);
    console.log("処理をスキップしました。");
    return;
  }

  const statusCell = sheet.getRange(range.getRow(), STATUS_COLUMN);
  // 処理状況が空欄でない場合は、多重実行を防ぐために処理を終了
  if (statusCell.getValue() !== "") {
    console.log("既に処理済みの行です。");
    return;
  }

  statusCell.setValue("許可");

  try {
    // 行データから申請者情報を取得
    const applicantName = sheet
      .getRange(range.getRow(), NAME_COLUMN)
      .getValue();
    const mailAddress = sheet.getRange(range.getRow(), EMAIL_COLUMN).getValue();

    // 1. Discordの招待リンクを作成
    const inviteLink = createDiscordInvite();
    if (!inviteLink) {
      throw new Error(
        "招待リンクの作成に失敗しました。Botの権限等を確認してください。"
      );
    }

    // 2. 招待メールを送信
    sendInvitationMail(applicantName, mailAddress, inviteLink);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラーが発生しました。";
    console.error(errorMessage);
    statusCell.setValue("");
  }
};

/**
 * Discordの招待リンクを生成する (1回限り/7日間有効)
 */
function createDiscordInvite(): string | null {
  const url = `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/invites`;
  const payload = { max_age: 604800, max_uses: 1, unique: true };
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());

  if (response.getResponseCode() === 200) {
    return `https://discord.gg/${result.code}`;
  }
  return null;
}

/**
 * 申請者に招待メールを送信する
 */
function sendInvitationMail(
  name: string,
  mailAddress: string,
  inviteLink: string
): void {
  const subject = "【KUPAC】サーバー参加のご招待";
  const body = `${name}様\n\nこの度は、KUPACへのご参加を申請いただき、誠にありがとうございます。\n無事、参加が承認されましたことをご連絡いたします。\n\nつきましては、下記Discordサーバーの招待リンクより、コミュニティへご参加ください。\nこのリンクは7日間有効で、1度のみ利用可能です。\n\n▼招待リンク\n${inviteLink}\n\n私たちのDiscordサーバーでお話できることを楽しみにしております。\n\nKUPAC\n運営一同`;
  GmailApp.sendEmail(mailAddress, subject, body);
}
