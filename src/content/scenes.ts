import { SI_MARK } from "./branches.ts";
import type { Line, Mark, PersonId, Scene } from "./types.ts";

// 場面で言う, as in ことのは: the person's line and the learner's own circumstances, never a finished Japanese answer to
// translate. Any reply that fits is fine; the samples (opened only when asked for) each put something else forward.
// Each scene is made so that raised words are naturally needed (CONCEPT.md, 場面).

/** A word where it shows; `base` when the everyday word above it is not its usual one (커피 드실래요? is 마시다). */
const m = (word: string, text: string, base?: string): Mark => (base ? { word, text, base } : { word, text });
const si = (text: string, base: string): Mark => ({ word: SI_MARK, text, base });
const said = (id: string, by: PersonId, ko: string, ja: string, marks: Mark[] = [], about?: string): Line =>
  about ? { id, by, to: "me", about, ko, ja, marks } : { id, by, to: "me", ko, ja, marks };

export const SCENES: Scene[] = [
  {
    id: "dinner",
    place: "house",
    title: "下宿の夕飯",
    situation: "夜、下宿に帰ると、할머니が台所から声をかけてきた。",
    line: said("dinner", "halmeoni", "밥은 먹었니? 저녁 차려 놨다.", "ご飯は食べたのかい？夕飯、用意してあるよ。", [m("밥", "밥"), m("먹다", "먹었")]),
    mine: "友だちと食べてきた。でも、用意してくれたのはうれしい。할머니はまだ食べていないみたい。",
    samples: [
      {
        ko: "저 먹고 왔어요. 할머니는 진지 드셨어요?",
        ja: "わたしは食べてきました。おばあちゃんはご飯、召し上がりましたか？",
        puts: "食べてきたと言って、할머니のことを聞く",
        marks: [m("저", "저"), m("진지", "진지"), m("드시다", "드셨")],
      },
      { ko: "죄송해요, 친구랑 먹고 왔어요. 내일 아침에 잘 먹을게요.", ja: "すみません、友だちと食べてきました。明日の朝、いただきます。", puts: "謝って、明日の朝に食べると言う" },
      {
        ko: "감사해요. 배부르지만 조금만 먹을게요. 할머니도 같이 드세요.",
        ja: "ありがとうございます。お腹いっぱいだけど、少しだけ食べます。おばあちゃんも一緒に召し上がってください。",
        puts: "お礼を言って、一緒に食べようと言う",
        marks: [m("드시다", "드세요")],
      },
    ],
    brief: "You made dinner for the student and have not eaten yet yourself. It is evening. React kindly to their answer.",
  },
  {
    id: "goodnight",
    place: "house",
    title: "遅い帰り",
    situation: "課題で遅くなって、夜12時に下宿へ帰った。할머니がまだ起きていた。",
    line: said("goodnight", "halmeoni", "이제 오니? 많이 늦었네. 얼른 씻고 자라.", "今帰ったのかい？ずいぶん遅かったね。早くお風呂に入って寝なさい。", [m("자다", "자라")]),
    mine: "課題で遅くなった。待っていてくれたみたい。할머니ももう寝るところ。おやすみを言いたい。",
    samples: [
      { ko: "늦어서 죄송해요. 할머니도 안녕히 주무세요.", ja: "遅くなってすみません。おばあちゃんも、おやすみなさい。", puts: "謝って、おやすみを言う", marks: [m("주무시다", "주무세요")] },
      {
        ko: "기다리셨어요? 저 때문에 못 주무셨죠. 얼른 주무세요.",
        ja: "待っていてくださったんですか？わたしのせいで眠れなかったですよね。早くお休みになってください。",
        puts: "待たせたことを気づかう",
        marks: [si("기다리셨", "기다리다"), m("저", "저"), m("주무시다", "주무셨"), m("주무시다", "주무세요")],
      },
    ],
    brief: "It is midnight. You stayed up because the student was late and you were a little worried. You are about to go to bed.",
  },
  {
    id: "morning",
    place: "house",
    title: "朝の台所",
    situation: "朝、台所に行くと、할머니が朝ご飯を作っていた。",
    line: said("morning", "halmeoni", "일어났니? 잘 잤어?", "起きたのかい？よく眠れた？", [m("자다", "잤")]),
    mine: "よく眠れた。할머니がよく眠れたかも聞きたい。朝ご飯を手伝いたい。",
    samples: [
      { ko: "네, 잘 잤어요. 할머니도 잘 주무셨어요?", ja: "はい、よく眠れました。おばあちゃんもよくお休みになれましたか？", puts: "答えて、할머니のことも聞く", marks: [m("주무시다", "주무셨")] },
      {
        ko: "안녕히 주무셨어요? 제가 도와 드릴게요.",
        ja: "おはようございます。わたしが手伝います。",
        puts: "朝のあいさつをして、手伝いを申し出る",
        marks: [m("주무시다", "주무셨"), m("저", "제가"), m("드리다", "드릴")],
      },
    ],
    brief: "It is morning and you are making breakfast. You slept so-so because your back hurt a little.",
  },
  {
    id: "first-day",
    place: "house",
    title: "下宿の初日",
    situation: "今日から下宿に住む。荷物を持って行くと、할머니が出てきた。",
    line: said("first-day", "halmeoni", "네가 일본에서 온 학생이구나. 먼 데서 오느라 고생했다.", "あんたが日本から来た学生さんだね。遠くから大変だったろう。"),
    mine: "初めて会う。あいさつして、これからお世話になると言いたい。할머니の名前も聞いてみたい。",
    samples: [
      { ko: "처음 뵙겠습니다. 앞으로 잘 부탁드립니다.", ja: "初めまして。これからよろしくお願いします。", puts: "あいさつして、よろしくと言う", marks: [m("뵙다", "뵙"), m("드리다", "드립", "하다")] },
      {
        ko: "안녕하세요. 할머니, 성함이 어떻게 되세요?",
        ja: "こんにちは。おばあちゃん、お名前は何とおっしゃいますか？",
        puts: "あいさつして、名前を聞く",
        marks: [m("성함", "성함"), si("되세요", "되다")],
      },
      { ko: "감사합니다. 저 오늘부터 신세 많이 질게요.", ja: "ありがとうございます。今日から、たくさんお世話になります。", puts: "お世話になりますと言う", marks: [m("저", "저")] },
    ],
    brief: "The student is moving into your boarding house today. You are welcoming and a bit curious about Japan.",
  },
  {
    id: "back-pain",
    place: "house",
    title: "할머니の腰",
    situation: "夕方、할머니が腰を押さえて座っている。",
    line: said("back-pain", "halmeoni", "아이고, 오늘은 허리가 좀 아프네.", "ああ、今日は腰がちょっと痛いねえ。", [m("아프다", "아프")]),
    mine: "心配。病院に連れて行ける。夕飯は自分で何か買ってこられる。",
    samples: [
      {
        ko: "허리 많이 아프세요? 병원에 모시고 갈까요?",
        ja: "腰、だいぶ痛みますか？病院にお連れしましょうか？",
        puts: "具合を聞いて、病院に連れて行こうかと言う",
        marks: [m("아프시다", "아프세요"), m("모시다", "모시")],
      },
      { ko: "오늘은 쉬세요. 저녁은 제가 사 올게요.", ja: "今日は休んでください。夕飯はわたしが買ってきます。", puts: "休んでと言って、夕飯を買ってくると言う", marks: [si("쉬세요", "쉬다"), m("저", "제가")] },
    ],
    brief: "Your lower back hurts today, nothing serious. You are touched if the student worries, and you protest a little.",
  },
  {
    id: "birthday",
    place: "house",
    title: "할머니の誕生日",
    situation: "할머니が電話を切ってから、うれしそうに話しかけてきた。",
    line: said("birthday", "halmeoni", "내일 내 생일이라고 아들이 온단다.", "明日わたしの誕生日だからって、息子が来るんだって。", [m("내", "내"), m("생일", "생일"), m("아들", "아들")]),
    mine: "知らなかった。おめでとうと言いたい。小さなプレゼントを渡したい。",
    samples: [
      {
        ko: "내일 생신이세요? 미리 축하드려요!",
        ja: "明日お誕生日なんですか？ひと足先に、おめでとうございます！",
        puts: "誕生日と知って、先にお祝いを言う",
        marks: [m("생신", "생신"), si("이세요", "이다"), m("드리다", "드려", "하다")],
      },
      {
        ko: "아드님이 오세요? 좋으시겠어요.",
        ja: "息子さんがいらっしゃるんですか？うれしいですね。",
        puts: "息子さんが来るのを一緒に喜ぶ",
        marks: [m("아드님", "아드님"), si("오세요", "오다"), si("좋으시겠", "좋다")],
      },
      { ko: "작은 선물이라도 드리고 싶어요.", ja: "小さなものでも、プレゼントを差し上げたいです。", puts: "プレゼントを渡したいと言う", marks: [m("드리다", "드리")] },
    ],
    brief: "Tomorrow is your birthday and your son is coming from 부산. You are happy, and a little shy about any fuss.",
  },
  {
    id: "meeting",
    place: "lab",
    title: "面談の約束",
    situation: "박 교수님から、面談についてカトクが来た。",
    line: said("meeting", "park", "내일 오후 세 시에 연구실로 올 수 있어요?", "明日の午後3時に、研究室に来られますか？"),
    mine: "明日の午後はバイト。でも面談はしたい。あさってなら一日空いている。",
    samples: [
      {
        ko: "죄송하지만 내일 오후에는 아르바이트가 있어서요. 모레 찾아뵈어도 될까요?",
        ja: "申し訳ないのですが、明日の午後はアルバイトがあって。あさってお伺いしてもいいでしょうか？",
        puts: "事情を言って、別の日にうかがいたいと言う",
        marks: [m("찾아뵙다", "찾아뵈")],
      },
      { ko: "내일은 어려울 것 같습니다. 혹시 모레 시간 있으세요?", ja: "明日は難しそうです。もしかして、あさってお時間ありますか？", puts: "教授の都合を聞く", marks: [m("있으시다", "있으세요")] },
      {
        ko: "모레는 언제든 괜찮습니다. 편하신 시간에 찾아뵙겠습니다.",
        ja: "あさってならいつでも大丈夫です。ご都合のいい時間にお伺いします。",
        puts: "教授の都合に合わせると言う",
        marks: [si("편하신", "편하다"), m("찾아뵙다", "찾아뵙")],
      },
    ],
    brief: "You want to meet the student to talk about their report. You are flexible about the time. Reply in a short message.",
  },
  {
    id: "question",
    place: "lab",
    title: "研究室で質問",
    situation: "レポートのことで、박 교수님の研究室を訪ねた。",
    line: said("question", "park", "어, 들어와요. 무슨 일이에요?", "ああ、どうぞ入ってください。どうしましたか？"),
    mine: "レポートの書き方で、一つ聞きたいことがある。授業で教授が言っていたことが、よく分からなかった。",
    samples: [
      { ko: "교수님, 하나 여쭤봐도 될까요?", ja: "教授、一つ伺ってもいいですか？", puts: "質問していいか聞く", marks: [m("여쭙다", "여쭤")] },
      { ko: "수업 때 말씀하신 부분이 잘 이해가 안 돼서요.", ja: "授業でおっしゃったところが、よく分からなくて。", puts: "分からなかったところを言う", marks: [m("말씀하시다", "말씀하신")] },
    ],
    brief: "The student came to your office. You are glad they came. Help them, and ask which part was unclear.",
  },
  {
    id: "absent",
    place: "lab",
    title: "休んだ次の日",
    situation: "きのう熱があって授業を休んだ。今日、廊下で박 교수님に会った。",
    line: said("absent", "park", "어제 수업에 안 왔던데, 무슨 일 있었어요?", "きのう授業に来ていませんでしたが、何かありましたか？"),
    mine: "熱があって休んだ。先に連絡しなかったのを謝りたい。",
    samples: [
      {
        ko: "열이 나서 못 갔어요. 미리 말씀 못 드려서 죄송합니다.",
        ja: "熱が出て行けませんでした。前もってお伝えできず、すみません。",
        puts: "理由を言って、連絡しなかったことを謝る",
        marks: [m("말씀드리다", "말씀 못 드려")],
      },
      { ko: "죄송합니다. 제가 어제 몸이 안 좋아서 결석했습니다.", ja: "すみません。きのう体調が悪くて欠席しました。", puts: "謝って、理由を言う", marks: [m("저", "제가")] },
    ],
    brief: "You noticed the student was absent yesterday and are a little concerned. Be understanding, and mention what they missed.",
  },
  {
    id: "treat",
    place: "club",
    title: "先輩のおごり",
    situation: "サークルのあと、지은 선배とご飯を食べに来た。",
    line: said("treat", "jieun", "오늘은 내가 살게. 먹고 싶은 거 골라.", "今日はわたしがおごるよ。食べたいもの選んで。", [m("나", "내가"), m("먹다", "먹")]),
    mine: "うれしい。でも悪い気もする。先輩が何を食べるか聞きたい。次はわたしがおごりたい。",
    samples: [
      { ko: "잘 먹겠습니다! 선배는 뭐 드실 거예요?", ja: "いただきます！先輩は何にしますか？", puts: "お礼を言って、先輩が何にするか聞く", marks: [m("드시다", "드실")] },
      { ko: "감사해요. 다음엔 제가 사 드릴게요.", ja: "ありがとうございます。次はわたしがおごりますね。", puts: "お礼を言って、次は自分がおごると言う", marks: [m("저", "제가"), m("드리다", "드릴")] },
    ],
    brief: "You are treating your 후배 to dinner after the club meeting. You are in a good mood.",
  },
  {
    id: "senpai-father",
    place: "club",
    title: "先輩のお父さん",
    situation: "지은 선배が、週末の予定を話している。",
    line: said(
      "senpai-father",
      "jieun",
      "주말에 아빠가 서울에 오셔서 같이 밥 먹기로 했어.",
      "週末、お父さんがソウルに来るから、一緒にご飯を食べることにしたの。",
      [m("아버지", "아빠"), si("오셔서", "오다"), m("밥", "밥"), m("먹다", "먹")],
      "선배のお父さん",
    ),
    mine: "いいなと思う。お父さんがふだんどこに住んでいるのか聞きたい。",
    samples: [
      { ko: "좋겠어요! 아버님은 어디 사세요?", ja: "いいですね！お父さんはどちらにお住まいですか？", puts: "いいなと言って、お父さんの住まいを聞く", marks: [m("아버님", "아버님"), si("사세요", "살다")] },
      {
        ko: "아버님 댁이 어디세요? 서울에서 멀어요?",
        ja: "お父さんのお家はどちらですか？ソウルから遠いんですか？",
        puts: "お父さんの家がどこか聞く",
        marks: [m("아버님", "아버님"), m("댁", "댁"), si("어디세요", "이다")],
      },
    ],
    brief: "Your dad lives in 부산 and is visiting Seoul this weekend. You are happy about it. Talk about him a little.",
  },
  {
    id: "prof-gift",
    place: "club",
    title: "教授へのプレゼント",
    situation: "지은 선배からカトクが来た。",
    line: said(
      "prof-gift",
      "jieun",
      "다음 주가 교수님 생신이래. 연구실에서 같이 선물 사 드릴까?",
      "来週、教授の誕生日なんだって。研究室のみんなでプレゼント買おうか？",
      [m("생신", "생신"), m("드리다", "드릴")],
      "교수님",
    ),
    mine: "賛成。花がいいと思う。教授が何を好きか聞いてみたい。",
    samples: [
      {
        ko: "좋아요! 꽃은 어때요? 교수님께 드리면 좋아하실 것 같아요.",
        ja: "いいですね！花はどうですか？教授に差し上げたら、喜ばれると思います。",
        puts: "花を提案する",
        marks: [m("께", "께"), m("드리다", "드리"), si("좋아하실", "좋아하다")],
      },
      { ko: "좋아요. 교수님은 뭘 좋아하세요?", ja: "いいですね。教授は何がお好きなんですか？", puts: "教授の好きなものを聞く", marks: [si("좋아하세요", "좋아하다")] },
    ],
    brief: "You are organizing a birthday gift for 박 교수님 with the lab members. You know he likes tea and books.",
  },
  {
    id: "friend-grandma",
    place: "friend",
    title: "友だちのおばあさん",
    situation: "서준が授業に来なかった。カトクで聞くと、返事が来た。",
    line: said("friend-grandma", "seojun", "할머니가 갑자기 입원하셔서 나 지금 병원이야.", "おばあちゃんが急に入院して、今病院にいるんだ。", [si("입원하셔서", "입원하다")], "친구のおばあさん"),
    mine: "心配。おばあさんの具合を聞きたい。授業のノートは見せてあげられる。",
    samples: [
      { ko: "헐, 할머니 괜찮으셔? 많이 편찮으셔?", ja: "え、おばあちゃん大丈夫？具合、悪いの？", puts: "おばあさんの具合を聞く", marks: [si("괜찮으셔", "괜찮다"), m("편찮으시다", "편찮으셔")] },
      {
        ko: "걱정되겠다. 할머니 빨리 나으셨으면 좋겠다. 노트는 내가 보여 줄게.",
        ja: "心配だね。おばあちゃん、早く良くなるといいな。ノートは見せるよ。",
        puts: "気づかって、ノートを見せると言う",
        marks: [si("나으셨", "낫다"), m("나", "내가")],
      },
    ],
    brief: "Your grandmother was suddenly hospitalized; she is stable now. You are worried but okay, and grateful to your friend.",
  },
  {
    id: "cafe-guest",
    place: "cafe",
    title: "窓ぎわのお客さん",
    situation: "バイト中。年配のお客さんが二人、窓ぎわの席に座った。注文はもう聞いてある。",
    line: said("cafe-guest", "choi", "저기 손님들 주문하셨어?", "あそこのお客さん、注文した？", [si("주문하셨", "주문하다")], "お客さん"),
    mine: "聞いてある。二人とも温かいコーヒー。店内で飲むそう。",
    samples: [
      { ko: "네, 두 분 다 따뜻한 커피 드신대요.", ja: "はい、お二人とも温かいコーヒーだそうです。", puts: "人数と注文を伝える", marks: [m("분", "두 분", "두 명"), m("드시다", "드신", "마시다")] },
      {
        ko: "네, 매장에서 드시고 가신대요. 아메리카노 두 잔이요.",
        ja: "はい、店内で召し上がるそうです。アメリカーノ二つです。",
        puts: "店内で飲むと伝える",
        marks: [m("드시다", "드시", "마시다"), si("가신대요", "가다")],
      },
    ],
    brief: "It is busy at the counter. You want to know the order of the two elderly customers at the window. React and give the next small instruction.",
  },
  {
    id: "day-off",
    place: "cafe",
    title: "土曜のシフト",
    situation: "シフトの話をしていると、사장님が聞いてきた。",
    line: said("day-off", "choi", "다음 주 토요일에 일할 수 있지?", "来週の土曜、入れるよね？"),
    mine: "その日は、友だちのおじいさんのお葬式に行く。休ませてほしい。",
    samples: [
      {
        ko: "죄송해요. 친구 할아버지께서 돌아가셔서 장례식에 가야 해요.",
        ja: "すみません。友だちのおじいさんが亡くなったので、お葬式に行かないといけないんです。",
        puts: "理由を言って、行けないと伝える",
        marks: [m("께서", "께서"), m("돌아가시다", "돌아가셔")],
      },
      { ko: "그날은 어려울 것 같아요. 친구 할아버지가 돌아가셨대요.", ja: "その日は難しそうです。友だちのおじいさんが亡くなったそうで。", puts: "難しいと言って、事情を伝える", marks: [m("돌아가시다", "돌아가셨")] },
    ],
    brief: "You need someone on Saturday, but you understand family matters. Respond like a reasonable boss and offer condolences briefly.",
  },
  {
    id: "friend-mom",
    place: "friend",
    title: "友だちのお母さんの電話",
    situation: "知らない番号から電話。서준のお母さんだった。",
    line: said("friend-mom", "mikyung", "혹시 서준이 친구니? 서준이가 전화를 안 받아서.", "もしかして서준のお友だち？서준が電話に出なくて。"),
    mine: "今日は一緒じゃない。でも夕方の授業で会うので、伝えられる。",
    samples: [
      {
        ko: "네, 어머님. 지금은 같이 없는데, 이따 수업에서 만나면 말씀 전해 드릴게요.",
        ja: "はい、お母さん。今は一緒じゃないんですが、あとで授業で会ったらお伝えしますね。",
        puts: "一緒じゃないと言って、伝言を引き受ける",
        marks: [m("어머님", "어머님"), m("말씀", "말씀"), m("드리다", "드릴")],
      },
      { ko: "안녕하세요, 어머님. 서준이한테 전화 드리라고 할게요.", ja: "こんにちは、お母さん。서준に電話するよう伝えます。", puts: "電話するように伝えると言う", marks: [m("어머님", "어머님"), m("드리다", "드리", "하다")] },
    ],
    brief: "Your son 서준 isn't answering his phone and you want him to call home about dinner this weekend. You are warm and a little chatty.",
  },
];
