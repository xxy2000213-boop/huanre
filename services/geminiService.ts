import { GoogleGenAI } from "@google/genai";
import { SealInputs, SealResults } from "../types";

const processInputsToString = (inputs: SealInputs, results: SealResults): string => {
  return `
    输入参数:
    - 动环外径 (Outer Diameter): ${inputs.d_outer} m
    - 转速 (Speed): ${inputs.n_rpm} rpm
    - 流体密度 (Density): ${inputs.rho} kg/m^3
    - 动力粘度 (Viscosity): ${inputs.mu} Pa*s
    - 导热系数 (Thermal Cond.): ${inputs.lambda_gas} W/(m*K)
    - 普朗特数 (Prandtl): ${inputs.Pr}
    - 轴向流速 (Axial Velocity): ${inputs.u_axial} m/s
    - 密封间隙 (Gap): ${inputs.delta_gap} m
    - 水力直径 (Hyd. Diameter): ${inputs.d_hyd} m

    计算结果:
    - 旋转雷诺数 (Re_rot): ${results.Re_rot.toFixed(2)}
    - 轴向雷诺数 (Re_ax): ${results.Re_ax.toFixed(2)}
    - 静态努塞尔数 (Nu_s): ${results.Nu_s.toFixed(2)}
    - 静环换热系数 (H_s): ${results.H_s.toFixed(2)} W/(m^2*K)
    - 动态努塞尔数 (Nu_r): ${results.Nu_r.toFixed(2)}
    - 动环换热系数 (H_r): ${results.H_r.toFixed(2)} W/(m^2*K)
  `;
};

export const analyzeResults = async (inputs: SealInputs, results: SealResults): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key 缺失");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const dataString = processInputsToString(inputs, results);

  const prompt = `
    你是一位专门从事涡轮机械和干气密封的高级机械工程师。
    请分析以下干气密封热传递模拟的计算结果。

    数据:
    ${dataString}

    请提供一份简明扼要的工程评估报告（中文，最多 150 字），内容涵盖：
    1. 流动状态：根据雷诺数判断流动是主导旋转流（Couette）还是轴向流（Poiseuille）？
    2. 换热效率：比较 H_s 和 H_r。哪个环（动环或静环）的散热更有效？
    3. 潜在风险：这些数值是否在典型范围内，是否存在热变形的风险？
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "无法生成分析结果。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("生成 AI 分析失败。");
  }
};