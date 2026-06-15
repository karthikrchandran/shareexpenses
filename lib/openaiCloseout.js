async function polishTripCloseoutWithAI(summary, options = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const model = options.model ?? process.env.OPENAI_CLOSEOUT_MODEL ?? 'gpt-5.5';
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!apiKey) {
    return {
      aiGenerated: false,
      aiModel: null,
      summary,
    };
  }

  try {
    const response = await fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions: [
          'You polish trip expense closeout copy.',
          'Do not change, invent, or remove any financial numbers.',
          'Return concise JSON with narrative, groupMessage, and insights.',
        ].join(' '),
        input: JSON.stringify({
          expenseSetName: summary.expenseSetName,
          totalAmount: summary.totalAmount,
          categoryTotals: summary.categoryTotals,
          payerTotals: summary.payerTotals,
          settlements: summary.settlements,
          largestExpenses: summary.largestExpenses,
          insights: summary.insights,
          flags: summary.flags,
          currentNarrative: summary.narrative,
          currentGroupMessage: summary.groupMessage,
        }),
        text: {
          format: {
            type: 'json_schema',
            name: 'trip_closeout_copy',
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['narrative', 'groupMessage', 'insights'],
              properties: {
                narrative: { type: 'string' },
                groupMessage: { type: 'string' },
                insights: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI closeout polish failed with ${response.status}`);
    }

    const payload = await response.json();
    const outputText = payload.output_text
      || payload.output?.flatMap((item) => item.content || [])
        .map((content) => content.text)
        .filter(Boolean)
        .join('\n');
    const polished = JSON.parse(outputText);

    return {
      aiGenerated: true,
      aiModel: model,
      summary: {
        ...summary,
        narrative: polished.narrative || summary.narrative,
        groupMessage: polished.groupMessage || summary.groupMessage,
        insights: Array.isArray(polished.insights) && polished.insights.length > 0
          ? polished.insights
          : summary.insights,
      },
    };
  } catch (error) {
    console.error('AI closeout polish failed, using deterministic summary:', error);
    return {
      aiGenerated: false,
      aiModel: null,
      summary,
    };
  }
}

module.exports = {
  polishTripCloseoutWithAI,
};
