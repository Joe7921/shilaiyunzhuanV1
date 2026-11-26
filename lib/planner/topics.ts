export const pitfallTopics={
  salt:{label:'口味偏咸',tip:'先加一半咸味调料，熟后尝味再补。'},
  heat:{label:'火候不好掌握',tip:'先把食材切成相近大小，再按步骤中描述的状态调整火力。'},
  burnt:{label:'容易糊底',tip:'留意锅底，尤其是含糖或收汁阶段，必要时调小火。'},
  texture:{label:'成品口感不对',tip:'记录切块厚度和实际耗时，下次只调整其中一项。'},
  prep:{label:'备料时间不够',tip:'先完成浸泡、腌制或切配，再开火。'},
  gear:{label:'厨具不合适',tip:'先核对锅具大小和加热方式，留出翻动空间。'},
} as const;
export type PitfallTopic=keyof typeof pitfallTopics;
