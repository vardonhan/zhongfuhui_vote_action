const axios = require('axios');
const qs = require('qs');
const base = 'https://backend.h7o.cn';
const { AUTHORIZATION, VOTE_ID, WECHAT_NOTIFY_KEY } = process.env;
const headers = {
    'Authorization': `Bearer ${AUTHORIZATION}`,
    'Content-Type': 'application/x-www-form-urlencoded',
};
const answerArray = ['A', 'B', 'C', 'D', 'E', 'F']; // 
const voteId = VOTE_ID;
const notifyKey = WECHAT_NOTIFY_KEY;

async function getQuestion() {
    const res = await axios.post(
        base + '/api/getQuestion',
        qs.stringify({
            cat_id: 1,
            type: 1,
            num: 3,
            wid: 1,
        }),
        {
            headers,
        },
    );
    console.log(res.data);
    return res.data.data;
};

async function submitQuestion(id, answer) {
    const res = await axios.post(
        base + '/api/subQuestion',
        qs.stringify({
            id,
            answer,
            wid: 1,
        }),
        {
            headers,
        },
    );
    // console.log(res.data);
    return res && res.data && res.data.data && res.data.data.is_right ? res.data.data.id : null;
};

async function getRightAnswerIds(questions) {
    const rightAnswerIds = [];
    if (Array.isArray(questions)) {
        for (const q of questions) {
            const { id } = q;
            for (const answer of answerArray) {
                const submitRes = await submitQuestion(id, answer);
                if (submitRes) {
                    // console.log(`题号：${id}， 答案：${answer}，答题编号：${submitRes}`);
                    rightAnswerIds.push(submitRes);
                    break;
                }
            }
        }
    }
    return rightAnswerIds;
}

async function vote() {
    const questions = await getQuestion();
    const ids = await getRightAnswerIds(questions);
    
    const postData = {
        works_id: voteId,
        ids: ids.join(','),
        wid: 1,
    };

    const res = await axios.post(
        base + '/api/vote',
        qs.stringify(postData),
        {
            headers,
        },
    );
    // console.log(res.data);

    // 微信通知
    const { code, msg, data } = res.data;
    const title = code ? '投票失败' : '投票成功';
    const desp = code ? msg : `${data.works.author} 票数: ${data.works.vote}`;
    console.log(`${title}, ${desp}`);
    axios.get(
        `https://sctapi.ftqq.com/${notifyKey}.send?title=${title}，${desp}`
    );
}

vote();