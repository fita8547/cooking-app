import OpenAI from 'openai';

class AICoachingService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.openai = apiKey && apiKey !== 'your_openai_api_key_here' 
      ? new OpenAI({ apiKey }) 
      : null;
  }

  /**
   * 오늘의 간단한 코칭 메시지 생성 (홈 화면용)
   */
  async generateDailyInsight(mealHistory, healthProfile, nutritionTargets) {
    if (!this.openai) {
      return this._getMockDailyInsight(mealHistory, nutritionTargets);
    }

    try {
      const recentMeals = mealHistory.slice(0, 3); // 최근 3끼
      const prompt = this._buildDailyInsightPrompt(recentMeals, healthProfile, nutritionTargets);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "당신은 친근하고 전문적인 영양 코치입니다. 사용자의 식사 기록을 분석하고 한 줄로 간단한 조언을 제공합니다. 격려와 실용적인 팁을 포함하세요."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI daily insight generation failed:', error);
      return this._getMockDailyInsight(mealHistory, nutritionTargets);
    }
  }

  /**
   * 주간 상세 분석 생성 (식사 기록 페이지용)
   */
  async generateWeeklyAnalysis(mealHistory, healthProfile, nutritionTargets) {
    if (!this.openai) {
      return this._getMockWeeklyAnalysis(mealHistory, nutritionTargets);
    }

    try {
      const last7Days = mealHistory.slice(0, 21); // 최근 7일 (하루 3끼 가정)
      const prompt = this._buildWeeklyAnalysisPrompt(last7Days, healthProfile, nutritionTargets);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "당신은 전문 영양사입니다. 사용자의 주간 식사 기록을 분석하고 구체적인 개선 방안을 제시합니다. 긍정적이고 실천 가능한 조언을 제공하세요."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('AI weekly analysis generation failed:', error);
      return this._getMockWeeklyAnalysis(mealHistory, nutritionTargets);
    }
  }

  _buildDailyInsightPrompt(recentMeals, healthProfile, nutritionTargets) {
    const mealSummary = recentMeals.map(m => 
      `${m.name}: ${m.calories}kcal (단백질 ${m.protein}g, 탄수화물 ${m.carbs}g, 지방 ${m.fat}g)`
    ).join('\n');

    return `
사용자 정보:
- 목표: ${this._getGoalText(healthProfile?.dietaryGoal)}
- 일일 칼로리 목표: ${nutritionTargets?.calories || '미설정'}kcal
- 단백질 목표: ${nutritionTargets?.protein || '미설정'}g

최근 식사:
${mealSummary || '기록 없음'}

위 정보를 바탕으로 오늘의 식단에 대한 한 줄 조언을 한국어로 작성해주세요. 
격려와 함께 구체적인 행동 제안을 포함하세요. (최대 50자)
`;
  }

  _buildWeeklyAnalysisPrompt(last7Days, healthProfile, nutritionTargets) {
    const totalCalories = last7Days.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalProtein = last7Days.reduce((sum, m) => sum + (m.protein || 0), 0);
    const totalCarbs = last7Days.reduce((sum, m) => sum + (m.carbs || 0), 0);
    const totalFat = last7Days.reduce((sum, m) => sum + (m.fat || 0), 0);
    const avgCalories = Math.round(totalCalories / 7);

    return `
사용자 정보:
- 목표: ${this._getGoalText(healthProfile?.dietaryGoal)}
- 일일 칼로리 목표: ${nutritionTargets?.calories || '미설정'}kcal
- 단백질 목표: ${nutritionTargets?.protein || '미설정'}g

최근 7일 평균:
- 칼로리: ${avgCalories}kcal
- 단백질: ${Math.round(totalProtein / 7)}g
- 탄수화물: ${Math.round(totalCarbs / 7)}g
- 지방: ${Math.round(totalFat / 7)}g

다음 JSON 형식으로 주간 분석을 작성해주세요:
{
  "summary": "전반적인 평가 (2-3문장)",
  "strengths": ["잘하고 있는 점 1", "잘하고 있는 점 2"],
  "improvements": ["개선할 점 1", "개선할 점 2"],
  "recommendations": ["구체적인 추천 1", "구체적인 추천 2"]
}
`;
  }

  _getGoalText(goal) {
    const goals = {
      'weight_loss': '체중 감량',
      'weight_gain': '체중 증가',
      'maintenance': '체중 유지',
      'muscle_gain': '근육 증가'
    };
    return goals[goal] || '건강 관리';
  }

  _getMockDailyInsight(mealHistory, nutritionTargets) {
    if (!mealHistory || mealHistory.length === 0) {
      return "오늘의 첫 식사를 기록해보세요! 건강한 하루의 시작입니다 💪";
    }

    const recentCalories = mealHistory.slice(0, 3).reduce((sum, m) => sum + (m.calories || 0), 0);
    const targetCalories = nutritionTargets?.calories || 2000;

    if (recentCalories < targetCalories * 0.7) {
      return "오늘 칼로리 섭취가 부족해요. 영양가 있는 간식을 추가해보세요 🥗";
    } else if (recentCalories > targetCalories * 1.3) {
      return "오늘은 칼로리가 조금 높았어요. 내일은 가벼운 식단으로 조절해보세요 🌱";
    } else {
      return "좋아요! 균형 잡힌 식단을 유지하고 계시네요 ✨";
    }
  }

  _getMockWeeklyAnalysis(mealHistory, nutritionTargets) {
    return {
      summary: "이번 주 식단은 전반적으로 균형이 잘 잡혀있어요. 꾸준히 기록하고 계신 점이 훌륭합니다!",
      strengths: [
        "규칙적인 식사 시간을 잘 지키고 계세요",
        "다양한 식재료를 활용하고 있어요"
      ],
      improvements: [
        "단백질 섭취를 조금 더 늘려보세요",
        "채소 섭취량을 증가시키면 좋겠어요"
      ],
      recommendations: [
        "아침에 계란이나 그릭 요거트를 추가해보세요",
        "점심과 저녁에 샐러드를 곁들여보세요"
      ]
    };
  }
}

export default new AICoachingService();
