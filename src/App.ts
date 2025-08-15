const SHEET_NAME = "フォームの回答 1"; // 対象のシート名
const NAME_COLUMN = 3; // 申請者名の列番号
const EMAIL_COLUMN = 2; // メールアドレスの列番号
const APPROVAL_COLUMN = 8; // 承認チェックボックスの列番号
const STATUS_COLUMN = 7; // 処理ステータスを書き込む列番号

// --- .envから読み込む秘密情報 ---
const AWS_API_GATEWAY_URL: string = process.env.AWS_API_GATEWAY_URL || "";
const AWS_API_KEY: string = process.env.AWS_API_KEY || "";

export const App = (e: GoogleAppsScript.Events.SheetsOnEdit) => {
  const range = e.range;
  const sheet = range.getSheet();

  // 変更が承認列のチェックボックスで、かつ対象シートの場合のみ処理を続行
  if (
    sheet.getName() !== SHEET_NAME ||
    range.getColumn() !== APPROVAL_COLUMN ||
    range.getValue() !== true
  ) {
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
 * Discordの招待リンクを生成する (AWS API Gateway + Lambda経由)
 */
function createDiscordInvite(): string | null {
  try {
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: "get",
      headers: {
        "x-api-key": AWS_API_KEY,
      },
      muteHttpExceptions: true,
    };

    console.log(`AWS API Gateway URL: ${AWS_API_GATEWAY_URL}`);

    const response = UrlFetchApp.fetch(AWS_API_GATEWAY_URL, options);
    const responseCode = response.getResponseCode();

    console.log(`response ${response.getContentText()}`);

    if (responseCode !== 200) {
      console.error(
        `AWS API Gateway呼び出しに失敗しました。ステータスコード: ${responseCode}`
      );
      console.error(`レスポンス内容: ${response.getContentText()}`);
      return null;
    }

    const result = JSON.parse(response.getContentText());
    console.log("Discord招待リンクの作成に成功しました。");
    return result.inviteLink || result.invite_link;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラーが発生しました。";
    console.error(
      `Discord招待リンクの作成中にエラーが発生しました: ${errorMessage}`
    );
    if (error instanceof Error && error.stack) {
      console.error(`スタックトレース: ${error.stack}`);
    }
    return null;
  }
}

/**
 * 申請者に招待メールを送信する
 */
function sendInvitationMail(
  name: string,
  mailAddress: string,
  inviteLink: string
): void {
  try {
    const subject = "【KUPAC】サーバー参加のご招待";
    const body = `${name}様\n\nこの度は、KUPACへのご参加を申請いただき、誠にありがとうございます。\n無事、参加が承認されましたことをご連絡いたします。\n\nつきましては、下記Discordサーバーの招待リンクより、コミュニティへご参加ください。\nこのリンクは7日間有効で、1度のみ利用可能です。\n\n▼招待リンク\n${inviteLink}\n\n私たちのDiscordサーバーでお話できることを楽しみにしております。\n\nKUPAC\n運営一同`;
    GmailApp.sendEmail(mailAddress, subject, body);
    console.log(`招待メールの送信に成功しました。送信先: ${mailAddress}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラーが発生しました。";
    console.error(`招待メールの送信中にエラーが発生しました: ${errorMessage}`);
    console.error(`送信先メールアドレス: ${mailAddress}`);
    if (error instanceof Error && error.stack) {
      console.error(`スタックトレース: ${error.stack}`);
    }
    throw error; // メイン処理でエラーを捕捉するために再スロー
  }
}
