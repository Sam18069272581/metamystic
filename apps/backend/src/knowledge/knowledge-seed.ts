export const knowledgeSeed = [
  {
    title: "MetaMystic 命理知识库 MVP",
    sourceType: "curated_mvp",
    chunks: [
      chunk("ten-god-zhengguan", "career", ["十神", "正官", "事业", "规则"], ["career_path"], "正官代表秩序、规则、责任感与社会评价。正官旺或成用时，更适合稳定路径、资格认证、制度型组织与长期信誉建设。"),
      chunk("ten-god-qisha", "career", ["十神", "七杀", "压力", "竞争"], ["career_path", "risk"], "七杀代表压力、竞争、边界与行动风险。七杀不宜直接解读为坏事，关键在于是否有印星化杀、食神制杀或现实训练来承接。"),
      chunk("ten-god-zhengyin", "study_abroad", ["十神", "正印", "学习", "贵人"], ["study", "study_abroad"], "正印强调学习系统、资质、照护与贵人资源。问学业、跨境发展或长期积累时，正印成用通常提示先补知识、证书和支持网络。"),
      chunk("ten-god-pianyin", "career", ["十神", "偏印", "研究", "非标"], ["career_path", "study"], "偏印偏向研究、洞察、非标准知识与独处消化。适合深度学习、咨询、玄学、技术研究，但需要避免过度内耗和信息孤岛。"),
      chunk("ten-god-shishen", "wealth", ["十神", "食神", "表达", "技能"], ["wealth", "career_path"], "食神重视表达、作品、技能输出与稳定产出。用于财富决策时，不宜只看短期收益，更应看能力是否能长期复利。"),
      chunk("ten-god-shangguan", "career", ["十神", "伤官", "表达", "突破"], ["career_path", "relationship"], "伤官代表表达、质疑、创新和突破规则。它适合内容、产品、创意与改革场景，但在组织内需要处理好权威关系。"),
      chunk("ten-god-zhengcai", "wealth", ["十神", "正财", "现金流", "稳定"], ["wealth"], "正财重视稳定收入、现实责任和可持续现金流。问投资或职业选择时，正财强的建议应偏向稳健预算和可验证回报。"),
      chunk("ten-god-piancai", "wealth", ["十神", "偏财", "机会", "资源"], ["wealth", "career_path"], "偏财代表机会、资源调度、商业嗅觉和非固定收益。偏财不是鼓励冒险，而是要求更强的信息差判断与风险边界。"),
      chunk("ten-god-bijian", "relationship", ["十神", "比肩", "自我", "同辈"], ["relationship", "career_path"], "比肩强调自我意志、同辈竞争和独立性。关系议题中，比肩旺需要看见自己的边界，也要避免把亲密关系变成输赢。"),
      chunk("ten-god-jiecai", "wealth", ["十神", "劫财", "合作", "分配"], ["wealth", "relationship"], "劫财与合作、分配、朋友资源和竞争性支出有关。涉及合伙或借贷时，需要先确认权责、退出机制和现金流压力。"),
      chunk("pattern-shayin", "study_abroad", ["格局", "杀印相生", "学习", "专业"], ["study", "study_abroad", "career_path"], "杀印相生强调压力与学习系统之间的转化：外部挑战越强，越需要知识、资质、导师或组织资源来承接，适合技术、学历、跨境与专业路线。"),
      chunk("pattern-shishen-shengcai", "wealth", ["格局", "食神生财", "变现", "技能"], ["wealth", "career_path"], "食神生财重视作品、技能输出与稳定变现。决策重点不是立刻赚多少钱，而是这条路线能否持续产出、持续被市场购买。"),
      chunk("pattern-shangguan-peiyin", "career", ["格局", "伤官配印", "创意", "资质"], ["career_path", "study"], "伤官配印适合把表达、创意和专业资质结合起来。它提示先建立可信度，再释放锋芒，避免只有观点没有承接系统。"),
      chunk("day-master-weak", "decision_safety", ["日主", "身弱", "节奏", "支持"], ["risk", "career_path"], "日主偏弱时，建议优先补足资源、节奏和支持系统，避免在信息不足、身体低电量或情绪透支时做高风险决策。"),
      chunk("day-master-strong", "decision_safety", ["日主", "身强", "行动", "边界"], ["risk", "career_path"], "日主偏强时，行动力和主观性更明显。建议把优势用于推进关键事项，同时用规则、反馈和协作来校准过度用力。"),
      chunk("element-wood", "career", ["五行", "木", "成长", "规划"], ["career_path", "study"], "木代表生长、规划、教育与长期主义。木气成为用神时，适合学习、内容、咨询、产品规划和持续成长型路径。"),
      chunk("element-fire", "career", ["五行", "火", "表达", "曝光"], ["career_path", "relationship"], "火代表表达、可见度、传播和热情。火气成为用神时，适合品牌、内容、演讲、销售和需要被看见的场景。"),
      chunk("element-earth", "wealth", ["五行", "土", "承载", "稳定"], ["wealth", "career_path"], "土代表承载、组织、流程和稳定。土气成为用神时，建议重视项目管理、资产沉淀、长期责任和可复制流程。"),
      chunk("element-metal", "career", ["五行", "金", "规则", "执行"], ["career_path", "risk"], "金代表规则、标准、执行和边界。金气成为用神时，适合制度型组织、工程质量、法务合规、审计和精密执行。"),
      chunk("element-water", "study_abroad", ["五行", "水", "流动", "跨境"], ["study_abroad", "career_path"], "水代表流动、信息、语言、迁移和连接。水气成为用神时，跨境、语言、研究、咨询和信息型工作更容易形成通路。"),
      chunk("relationship-compatibility", "relationship", ["关系", "亲密", "互补", "边界"], ["relationship"], "关系分析不能只看合不合，更要看双方的需求表达、冲突修复和现实边界。互补是资源，失衡时也会变成消耗。"),
      chunk("study-abroad-decision", "study_abroad", ["出国", "留学", "迁移", "长期"], ["study_abroad"], "出国发展要同时看命盘中的流动性、学习承接能力和现实资源。适合不等于轻松，关键在语言、身份、现金流和支持系统能否闭环。"),
      chunk("career-decision", "career", ["事业", "职业", "选择", "路径"], ["career_path"], "职业决策应区分短期机会和长期结构。命理建议更适合帮助识别优势、压力来源和节奏，不应替代真实行业调研。"),
      chunk("decision-guardrail", "decision_safety", ["风控", "免责声明", "决策", "安全"], ["risk"], "命理分析适合作为自我观察和决策辅助，不应输出绝对化断语。涉及医疗、法律、财务和人身安全时，应引导用户寻求专业帮助。")
    ]
  }
];

function chunk(
  anchorId: string,
  topic: string,
  tags: string[],
  decisionScenarios: string[],
  content: string
) {
  return {
    anchorId,
    content,
    metadata: {
      domain: "bazi",
      topic,
      classicalSource: classicalSourceFor(anchorId),
      displayTitle: displayTitleFor(anchorId, tags),
      tags,
      decisionScenarios
    }
  };
}

function classicalSourceFor(anchorId: string): string {
  if (anchorId.startsWith("ten-god") || anchorId.startsWith("pattern")) {
    return "\u300a\u5b50\u5e73\u771f\u8be0\u300b\u4e49\u7406\u6574\u7406";
  }
  if (anchorId.startsWith("element") || anchorId.startsWith("day-master")) {
    return "\u300a\u6ef4\u5929\u9ad3\u300b\u4e49\u7406\u6574\u7406";
  }
  if (anchorId.includes("study-abroad") || anchorId.includes("career") || anchorId.includes("relationship")) {
    return "\u300a\u7a77\u901a\u5b9d\u9274\u300b\u4e49\u7406\u6574\u7406";
  }
  return "\u300a\u6ef4\u5929\u9ad3\u300b\u4e49\u7406\u6574\u7406";
}

function displayTitleFor(anchorId: string, tags: string[]): string {
  const explicitTitles: Record<string, string> = {
    "pattern-shayin": "\u6740\u5370\u76f8\u751f",
    "pattern-shishen-shengcai": "\u98df\u795e\u751f\u8d22",
    "pattern-shangguan-peiyin": "\u4f24\u5b98\u914d\u5370",
    "day-master-weak": "\u65e5\u4e3b\u504f\u5f31",
    "day-master-strong": "\u65e5\u4e3b\u504f\u5f3a",
    "study-abroad-decision": "\u51fa\u56fd\u53d1\u5c55",
    "career-decision": "\u4e8b\u4e1a\u51b3\u7b56",
    "relationship-compatibility": "\u5173\u7cfb\u4e92\u8865",
    "decision-guardrail": "\u98ce\u63a7\u8fb9\u754c"
  };

  return explicitTitles[anchorId] ?? tags.at(1) ?? tags.at(0) ?? "\u547d\u7406\u77e5\u8bc6";
}
