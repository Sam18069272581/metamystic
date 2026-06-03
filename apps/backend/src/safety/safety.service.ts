import { Injectable } from "@nestjs/common";

export interface SafetyResult {
  allowed: boolean;
  reason?: string;
  disclaimer: string;
}

const blockedPatterns = [
  /一定.*(死亡|死|离婚|发财|中奖)/,
  /(彩票|赌博|下注|梭哈|博彩)/,
  /(癌症|处方|用药|手术|诊断)/,
  /(什么时候死|会不会死|活多久)/
];

@Injectable()
export class SafetyService {
  evaluateQuestion(question: string): SafetyResult {
    const normalized = question.trim();
    const blocked = blockedPatterns.find((pattern) => pattern.test(normalized));
    const disclaimer = "本解读由 AI 命理系统生成，仅供自我观察与人生选择参考，不替代专业医疗、法律、财务或心理咨询。";

    if (blocked) {
      return {
        allowed: false,
        reason: "这个问题涉及医疗、生死、赌博或绝对化预测，平台不能提供确定性判断。",
        disclaimer
      };
    }

    return { allowed: true, disclaimer };
  }
}
