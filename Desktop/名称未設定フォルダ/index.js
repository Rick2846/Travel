// APIキーをセット（ここに新しいAPIキーを入れてください）
const apiKey = "sk-svcacct-Bh706G4hIwQ8fe2b3vG551eG5E0nGerdlSFup9xSKz7hQCT_SZLdTpjUm5jBx_HJ_c84T3BlbkFJuPZzeBfWWStOP5OzkXjJ-6nfGWs-EIj68wPnvUdP3mylrqLqNhpiLzXtN8zP5G9Mv7sA";

// リトライの遅延を設定（デフォルトは60秒）
const defaultRetryDelay = 60000; // 60秒
const maxRetries = 2;    // 最大2回リトライ

// フォーム送信時にAPIリクエストを送信する処理
document.getElementById("travel-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    // フォームからデータを取得
    const destination = document.getElementById("destination").value;
    const people = document.getElementById("people").value;
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const activities = document.getElementById("activities").value;

    // ChatGPT APIに送るプロンプトを作成
    const prompt = `旅行計画を作成してください: 行きたい場所: ${destination}, 人数: ${people}人, 日程: ${startDate}から${endDate}, やりたいこと: ${activities}`;

    try {
        await sendRequestWithRetry(prompt, 0); // 0回目の試行からスタート
    } catch (error) {
        console.error("Error:", error);
        displayPlan(`旅行計画を取得できませんでした。エラー: ${error.message}`);
    }
});

// APIリクエストのリトライ処理を行う関数
async function sendRequestWithRetry(prompt, retryCount) {
    try {
        // ChatGPT APIにリクエストを送信
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",  // gpt-3.5-turbo から gpt-4-turbo に変更
                messages: [{role: "system", content: "あなたは旅行プランナーです。"}, {role: "user", content: prompt}],
                max_tokens: 1000 // トークン数を減らす
            })
        });

        if (!response.ok) {
            if (response.status === 429 && retryCount < maxRetries) {
                // Retry-Afterヘッダーを取得して遅延時間を設定
                const retryAfter = response.headers.get("Retry-After");
                // Retry-Afterがなければエクスポネンシャルバックオフを使って遅延を増やす
                const delayTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : defaultRetryDelay * Math.pow(2, retryCount);
                console.log(`429エラーが発生しました。${delayTime / 1000}秒後にリトライします... (試行回数: ${retryCount + 1}/${maxRetries})`);
                await delay(delayTime); // リトライの前に遅延を追加
                return sendRequestWithRetry(prompt, retryCount + 1); // 再試行
            } else {
                throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            displayPlan(data.choices[0].message.content);
        } else {
            throw new Error("APIから正しいデータが返されませんでした。");
        }
    } catch (error) {
        throw error;
    }
}

// 遅延を追加する関数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 生成された旅行計画を画面に表示する関数
function displayPlan(plan) {
    const planContainer = document.getElementById("travel-plan");
    planContainer.innerText = plan;
}
