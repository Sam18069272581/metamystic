export type ShenshaTone = "supportive" | "mixed" | "caution";

export interface ShenshaInsight {
  label: string;
  category: string;
  tone: ShenshaTone;
  summary: string;
}

const fallbackInsight: Omit<ShenshaInsight, "label"> = {
  category: "神煞",
  tone: "mixed",
  summary: "当前规则库已识别此神煞名称，详细解释待补充。"
};

const shenshaInsights: Record<string, Omit<ShenshaInsight, "label">> = {
  天乙贵人: { category: "贵人", tone: "supportive", summary: "遇事较易得关键助力，适合借势、请教与链接资源。" },
  太极贵人: { category: "贵人", tone: "supportive", summary: "悟性与整合力较强，适合研究、修行、系统性学习。" },
  文昌贵人: { category: "才学", tone: "supportive", summary: "利表达、考试、写作和知识输出，适合把想法结构化。" },
  国印贵人: { category: "贵人", tone: "supportive", summary: "利规则、资质、组织背书，适合走专业认证或正式平台。" },
  金舆: { category: "资源", tone: "supportive", summary: "象征待遇、承载与资源条件，适合关注长期价值交换。" },
  天厨贵人: { category: "资源", tone: "supportive", summary: "衣食与口福之象，也代表服务、内容和稳定供给能力。" },
  禄神: { category: "资源", tone: "supportive", summary: "代表根气与稳定收益，适合经营长期可复用的能力。" },
  学堂: { category: "才学", tone: "supportive", summary: "学习吸收力较好，适合深造、证书和专业训练。" },
  词馆: { category: "才学", tone: "supportive", summary: "利语言、文书、表达和审美包装，适合内容型输出。" },
  三奇贵人: { category: "贵人", tone: "supportive", summary: "组合格局较有灵动之气，适合创新、跨界与关键机会把握。" },
  天德贵人: { category: "贵人", tone: "supportive", summary: "有化解与缓冲之象，遇压力时更适合用善缘和规则解围。" },
  月德贵人: { category: "贵人", tone: "supportive", summary: "利人缘与温和修复，适合用协调、合作来降低阻力。" },
  天喜: { category: "关系", tone: "supportive", summary: "喜庆、人缘与关系升温之象，适合推进公开表达和互动。" },
  红鸾: { category: "关系", tone: "supportive", summary: "情感缘分被点亮，适合主动建立连接，但仍需看整体命局。" },
  将星: { category: "行动", tone: "supportive", summary: "有主导、组织与承担之象，适合承担明确责任。" },
  天医: { category: "身心", tone: "supportive", summary: "利修复、疗愈和健康管理，适合建立长期身心照护习惯。" },

  驿马: { category: "迁移", tone: "mixed", summary: "变动、出行、迁移与跨地域机会增加，宜主动规划节奏。" },
  华盖: { category: "灵性", tone: "mixed", summary: "审美、孤高与研究气质较强，利专业沉淀，也要避免过度封闭。" },
  桃花: { category: "关系", tone: "mixed", summary: "吸引力与社交曝光增加，利人缘，也要留意边界与暧昧成本。" },
  红艳: { category: "关系", tone: "mixed", summary: "情感张力和表现力较强，适合魅力表达，也需稳住关系边界。" },
  十灵日: { category: "灵性", tone: "mixed", summary: "直觉与感受力较强，适合命理、艺术、心理和灵感型工作。" },
  六秀日: { category: "才学", tone: "mixed", summary: "才艺与表现力较突出，适合用作品、表达和审美建立辨识度。" },
  金神: { category: "行动", tone: "mixed", summary: "刚劲锐利，需要火炼成器；适合高标准行动，但忌急躁硬冲。" },
  八专: { category: "关系", tone: "mixed", summary: "专注度强，关系与欲望主题更敏感，宜把能量导向稳定承诺。" },
  魁罡: { category: "行动", tone: "mixed", summary: "气势刚强，适合担当和破局，但要避免过度强硬。" },

  羊刃: { category: "风险", tone: "caution", summary: "行动力强但锋芒重，遇冲突时要避免硬碰硬和冲动决策。" },
  流霞: { category: "风险", tone: "caution", summary: "情绪、意外和血光象较重，适合保守出行、稳住身体节奏。" },
  亡神: { category: "风险", tone: "caution", summary: "心神分散或暗耗较多，重大决策前要补足信息和复盘。" },
  劫煞: { category: "风险", tone: "caution", summary: "外部干扰和损耗感增强，适合降低杠杆、守住边界。" },
  灾煞: { category: "风险", tone: "caution", summary: "突发阻力象较明显，宜预留缓冲，不把计划压到极限。" },
  血刃: { category: "风险", tone: "caution", summary: "刀火血光之象，运动、驾驶、医美和器械操作要更谨慎。" },
  孤辰: { category: "关系", tone: "caution", summary: "独立感强，关系中容易保持距离，需要主动表达真实需求。" },
  寡宿: { category: "关系", tone: "caution", summary: "情感支持感偏弱时更明显，适合经营稳定陪伴与沟通频率。" },
  丧门: { category: "风险", tone: "caution", summary: "低气压或家宅牵挂之象，宜减少消耗型社交，照顾长辈与身心。" },
  吊客: { category: "风险", tone: "caution", summary: "外部牵连与低落信息较多，适合保持理性判断和边界。" },
  披麻: { category: "风险", tone: "caution", summary: "家宅、人情和责任压力增强，宜提前安排支持系统。" },
  阴阳差错: { category: "关系", tone: "caution", summary: "关系节奏容易错位，适合把期待说清楚，避免误会累积。" },
  十恶大败: { category: "风险", tone: "caution", summary: "资源承接力要谨慎评估，投资、合作和承诺不宜仓促。" },
  孤鸾煞: { category: "关系", tone: "caution", summary: "亲密关系里独立与孤高感较重，需要有意识经营柔软沟通。" },
  空亡: { category: "风险", tone: "caution", summary: "事情容易虚、空、落空，适合先验证、留余地，再投入重资源。" },
  勾绞煞: { category: "风险", tone: "caution", summary: "牵扯、纠缠和反复沟通较多，签约与关系议题要留证据。" },
  天罗: { category: "风险", tone: "caution", summary: "容易有受困或限制感，宜降低复杂度，先找出口再推进。" },
  地网: { category: "风险", tone: "caution", summary: "现实约束较强，适合拆解目标，避免陷入消耗型局面。" },
  天转: { category: "风险", tone: "caution", summary: "节奏易突然翻转，宜保留备选方案，避免单点押注。" },
  地转: { category: "风险", tone: "caution", summary: "基础条件易变，适合先稳住资源、合同和执行边界。" },
  九丑: { category: "关系", tone: "caution", summary: "关系与名声议题较敏感，适合谨慎表达，避免情绪化公开冲突。" }
};

export function getShenshaInsight(label: string): ShenshaInsight {
  const normalized = label.trim();
  return {
    label: normalized,
    ...(shenshaInsights[normalized] ?? fallbackInsight)
  };
}

export function buildShenshaInsights(labels: string[] | undefined): ShenshaInsight[] {
  return Array.from(new Set((labels ?? []).map((label) => label.trim()).filter(Boolean))).map(getShenshaInsight);
}
