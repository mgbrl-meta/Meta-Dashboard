import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Missing start or end date" },
        { status: 400 }
      );
    }

    const query = `
      WITH base AS (
        SELECT
          date,
          channel_type,
          COALESCE(impressions, 0) AS impressions,
          COALESCE(clicks, 0) AS clicks,
          COALESCE(cost, 0) AS spend,
          COALESCE(conversions, 0) AS conversions,
          COALESCE(conversion_value, 0) AS revenue
        FROM \`shopify-colab.brillare_shopify.google_campaign_daily_raw\`
        WHERE date BETWEEN @start AND @end
      ),

      totals AS (
        SELECT
          SUM(impressions) AS impressions,
          SUM(clicks) AS clicks,
          SUM(spend) AS spend,
          SUM(conversions) AS conversions,
          SUM(revenue) AS revenue
        FROM base
      ),

      channel AS (
        SELECT
          channel_type,
          SUM(impressions) AS impressions,
          SUM(clicks) AS clicks,
          SUM(spend) AS spend,
          SUM(conversions) AS conversions,
          SUM(revenue) AS revenue
        FROM base
        GROUP BY channel_type
      ),

      final AS (
        SELECT
          channel_type,
          impressions,
          clicks,
          spend,
          revenue,
          conversions,

          SAFE_DIVIDE(revenue, spend) AS roas,
          SAFE_DIVIDE(spend, conversions) AS cpa,
          SAFE_DIVIDE(clicks, impressions) AS ctr,
          SAFE_DIVIDE(conversions, clicks) AS cvr,
          SAFE_DIVIDE(revenue, clicks) AS rpc,

          SAFE_DIVIDE(spend, (SELECT spend FROM totals)) AS spend_share,
          SAFE_DIVIDE(revenue, (SELECT revenue FROM totals)) AS revenue_share,

          SAFE_DIVIDE(revenue, (SELECT revenue FROM totals))
          - SAFE_DIVIDE(spend, (SELECT spend FROM totals)) AS efficiency_gap,

          SAFE_DIVIDE((SELECT revenue FROM totals), (SELECT spend FROM totals)) AS account_roas,
          SAFE_DIVIDE((SELECT spend FROM totals), (SELECT conversions FROM totals)) AS account_cpa
        FROM channel
      )

      SELECT
        ARRAY(
          SELECT AS STRUCT
            channel_type,
            impressions,
            clicks,
            spend,
            revenue,
            conversions,
            roas,
            cpa,
            ctr,
            cvr,
            rpc,
            spend_share,
            revenue_share,
            efficiency_gap,

            CASE
              WHEN roas >= account_roas AND efficiency_gap > 0 THEN 'SCALE'
              WHEN roas < account_roas AND efficiency_gap < 0 THEN 'REDUCE'
              WHEN roas >= account_roas THEN 'HOLD_EFFICIENT'
              ELSE 'WATCH'
            END AS action,

            CASE
              WHEN roas >= account_roas AND efficiency_gap > 0
                THEN spend * 0.15

              WHEN roas < account_roas AND efficiency_gap < 0
                THEN spend * -0.15

              ELSE 0
            END AS suggested_budget_shift
          FROM final
          ORDER BY spend DESC
        ) AS channels,

        (SELECT AS STRUCT * FROM totals) AS totals
    `;

    const [rows] = await bigquery.query({
      query,
      params: { start, end },
    });

    const data = rows[0] || {};
    const totals = data.totals || {};

    return NextResponse.json({
      totals: {
        spend: totals.spend || 0,
        revenue: totals.revenue || 0,
        conversions: totals.conversions || 0,
        impressions: totals.impressions || 0,
        clicks: totals.clicks || 0,
      },
      channels: data.channels || [],
    });
  } catch (error: any) {
    console.error("Google Channel Mix API Error:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}