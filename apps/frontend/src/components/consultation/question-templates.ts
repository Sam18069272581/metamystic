export interface ConsultationQuestionTemplate {
  id: string;
  label: string;
  question: string;
}

export interface ConsultationQuestionTemplateCategory {
  id: string;
  label: string;
  templates: ConsultationQuestionTemplate[];
}

export const questionTemplateCategories: ConsultationQuestionTemplateCategory[] = [
  {
    id: "relationship",
    label: "感情",
    templates: [
      {
        id: "love-active",
        label: "是否主动",
        question: "最近感情状态怎么样？我适合主动推进这段关系吗？"
      },
      {
        id: "love-future",
        label: "关系走向",
        question: "我和对方接下来的关系走向如何？需要注意什么相处模式？"
      }
    ]
  },
  {
    id: "career",
    label: "事业",
    templates: [
      {
        id: "career-switch",
        label: "换工作",
        question: "今年换工作时机到了吗？我应该主动争取还是先稳住？"
      },
      {
        id: "career-growth",
        label: "发展方向",
        question: "我现在的事业发展方向适合我吗？下一步应该重点提升什么？"
      }
    ]
  },
  {
    id: "wealth",
    label: "财运",
    templates: [
      {
        id: "wealth-recent",
        label: "近期财运",
        question: "近期财运状态怎么样？适合做投资、合作或大额支出吗？"
      },
      {
        id: "wealth-risk",
        label: "风险判断",
        question: "这笔钱或这个合作机会值得投入吗？主要风险点在哪里？"
      }
    ]
  },
  {
    id: "study",
    label: "学业",
    templates: [
      {
        id: "study-exam",
        label: "考试备考",
        question: "接下来这段时间的学习和考试运势如何？我应该怎么调整节奏？"
      },
      {
        id: "study-abroad",
        label: "留学选择",
        question: "我适合出国读书或换一个城市发展吗？这个选择对我长期有利吗？"
      }
    ]
  },
  {
    id: "travel",
    label: "出行",
    templates: [
      {
        id: "travel-month",
        label: "本月出行",
        question: "这个月出行运势如何？适合远行、搬家或开启新计划吗？"
      },
      {
        id: "travel-timing",
        label: "时机选择",
        question: "这件事适合现在出发吗？如果要延后，应该注意什么信号？"
      }
    ]
  },
  {
    id: "social",
    label: "关系",
    templates: [
      {
        id: "social-conflict",
        label: "冲突处理",
        question: "我和这个人的冲突应该如何处理？现在适合沟通还是先冷静？"
      },
      {
        id: "social-team",
        label: "合作关系",
        question: "我和这个团队或合作伙伴是否合拍？合作中最需要防范什么？"
      }
    ]
  }
];

export function findConsultationQuestionTemplate(id: string): ConsultationQuestionTemplate | undefined {
  return questionTemplateCategories.flatMap((category) => category.templates).find((template) => template.id === id);
}
