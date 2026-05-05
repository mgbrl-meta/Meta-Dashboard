import { bigquery } from "@/lib/bigquery";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const compareStart = searchParams.get("compareStart") || start;
  const compareEnd = searchParams.get("compareEnd") || end;
  const tab = searchParams.get("tab") || "overview";
  const campaign = searchParams.get("campaign") || "";

  let query = "";

  if (tab === "overview") {
    query = `
      WITH current_period AS (
        SELECT SUM(spend) AS spend, SUM(revenue) AS revenue, SUM(purchases) AS purchases,
        SUM(impressions) AS impressions, SUM(reach) AS reach, SUM(clicks) AS clicks,
        SUM(lpv) AS lpv, SUM(atc) AS atc, SUM(checkout) AS checkout
        FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
        WHERE date BETWEEN @start AND @end
      ),
      compare_period AS (
        SELECT SUM(spend) AS spend, SUM(revenue) AS revenue, SUM(purchases) AS purchases,
        SUM(impressions) AS impressions, SUM(reach) AS reach, SUM(clicks) AS clicks,
        SUM(lpv) AS lpv, SUM(atc) AS atc, SUM(checkout) AS checkout
        FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
        WHERE date BETWEEN @compareStart AND @compareEnd
      )
      SELECT TO_JSON_STRING(current_period) AS current_data,
             TO_JSON_STRING(compare_period) AS compare_data
      FROM current_period, compare_period
    `;
  }

  if (tab === "trend") {
    query = `
      SELECT
        date,
        SUM(spend) AS spend,
        SUM(revenue) AS revenue,
        SUM(purchases) AS purchases,
        SUM(impressions) AS impressions,
        SUM(reach) AS reach,
        SUM(clicks) AS clicks,
        SUM(lpv) AS lpv,
        SUM(atc) AS atc,
        SUM(checkout) AS checkout,
        SAFE_DIVIDE(SUM(revenue), SUM(spend)) AS roas,
        SAFE_DIVIDE(SUM(spend), SUM(purchases)) AS cpa,
        SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100 AS ctr,
        SAFE_DIVIDE(SUM(spend), SUM(impressions)) * 1000 AS cpm,
        SAFE_DIVIDE(SUM(impressions), SUM(reach)) AS frequency
      FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
      WHERE date BETWEEN @start AND @end
      GROUP BY date
      ORDER BY date
    `;
  }

  if (tab === "campaign-list") {
    query = `
      SELECT DISTINCT campaign_name
      FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
      WHERE date BETWEEN @start AND @end
      ORDER BY campaign_name
    `;
  }

  if (tab === "campaign") {
    query = `
      SELECT
        campaign_id, campaign_name,
        SUM(spend) AS spend,
        SUM(revenue) AS revenue,
        SUM(purchases) AS purchases,
        SUM(impressions) AS impressions,
        SUM(reach) AS reach,
        SUM(clicks) AS clicks,
        SAFE_DIVIDE(SUM(revenue), SUM(spend)) AS roas,
        SAFE_DIVIDE(SUM(spend), SUM(purchases)) AS cpa,
        SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100 AS ctr,
        SAFE_DIVIDE(SUM(spend), SUM(impressions)) * 1000 AS cpm,
        SAFE_DIVIDE(SUM(impressions), SUM(reach)) AS frequency
      FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
      WHERE date BETWEEN @start AND @end
      GROUP BY campaign_id, campaign_name
      ORDER BY spend DESC
    `;
  }

  if (tab === "creative") {
    query = `
      WITH campaign_avg AS (
        SELECT
          SAFE_DIVIDE(SUM(revenue), SUM(spend)) AS campaign_roas,
          SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100 AS campaign_ctr,
          SAFE_DIVIDE(SUM(spend), SUM(purchases)) AS campaign_cpa,
          SAFE_DIVIDE(SUM(spend), SUM(impressions)) * 1000 AS campaign_cpm
        FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
        WHERE date BETWEEN @start AND @end
          AND (@campaign = '' OR campaign_name = @campaign)
      )
      SELECT
        creative_name,
        SUM(spend) AS spend,
        SUM(revenue) AS revenue,
        SUM(purchases) AS purchases,
        SUM(impressions) AS impressions,
        SUM(reach) AS reach,
        SUM(clicks) AS clicks,
        SUM(lpv) AS lpv,
        SUM(atc) AS atc,
        SUM(checkout) AS checkout,
        SAFE_DIVIDE(SUM(revenue), SUM(spend)) AS roas,
        SAFE_DIVIDE(SUM(spend), SUM(purchases)) AS cpa,
        SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100 AS ctr,
        SAFE_DIVIDE(SUM(spend), SUM(impressions)) * 1000 AS cpm,
        SAFE_DIVIDE(SUM(impressions), SUM(reach)) AS frequency,
        ca.campaign_roas,
        ca.campaign_ctr,
        ca.campaign_cpa,
        ca.campaign_cpm,
        COALESCE(SAFE_DIVIDE(SAFE_DIVIDE(SUM(revenue), SUM(spend)), NULLIF(ca.campaign_roas, 0)), 0) AS roas_index,
        COALESCE(SAFE_DIVIDE(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, NULLIF(ca.campaign_ctr, 0)), 0) AS ctr_index
      FROM \`shopify-colab.brillare_shopify.meta_os_daily\`, campaign_avg ca
      WHERE date BETWEEN @start AND @end
        AND (@campaign = '' OR campaign_name = @campaign)
      GROUP BY creative_name, ca.campaign_roas, ca.campaign_ctr, ca.campaign_cpa, ca.campaign_cpm
      ORDER BY spend DESC
    `;
  }

  if (tab === "adset") {
    query = `
      WITH campaign_total AS (
        SELECT
          SUM(spend) AS campaign_spend,
          SUM(revenue) AS campaign_revenue,
          SUM(purchases) AS campaign_purchases,
          SUM(reach) AS campaign_reach
        FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
        WHERE date BETWEEN @start AND @end
          AND (@campaign = '' OR campaign_name = @campaign)
      )
      SELECT
        campaign_name,
        adset_id,
        adset_name,
        SUM(spend) AS spend,
        SUM(revenue) AS revenue,
        SUM(purchases) AS purchases,
        SUM(impressions) AS impressions,
        SUM(reach) AS reach,
        SAFE_DIVIDE(SUM(revenue), SUM(spend)) AS roas,
        SAFE_DIVIDE(SUM(spend), SUM(purchases)) AS cpa,
        SAFE_DIVIDE(SUM(impressions), SUM(reach)) AS frequency,
        SAFE_DIVIDE(SUM(spend), ct.campaign_spend) * 100 AS spend_share,
        SAFE_DIVIDE(SUM(reach), ct.campaign_reach) * 100 AS reach_contribution,
        ct.campaign_spend,
        ct.campaign_revenue,
        ct.campaign_purchases,
        ct.campaign_reach
      FROM \`shopify-colab.brillare_shopify.meta_os_daily\`, campaign_total ct
      WHERE date BETWEEN @start AND @end
        AND (@campaign = '' OR campaign_name = @campaign)
      GROUP BY campaign_name, adset_id, adset_name,
        ct.campaign_spend, ct.campaign_revenue, ct.campaign_purchases, ct.campaign_reach
      ORDER BY spend DESC
    `;
  }

  if (tab === "funnel") {
    query = `
      WITH current_period AS (
        SELECT SUM(impressions) AS impressions, SUM(clicks) AS clicks,
        SUM(lpv) AS lpv, SUM(atc) AS atc, SUM(checkout) AS checkout,
        SUM(purchases) AS purchases
        FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
        WHERE date BETWEEN @start AND @end
          AND (@campaign = '' OR campaign_name = @campaign)
      ),
      compare_period AS (
        SELECT SUM(impressions) AS impressions, SUM(clicks) AS clicks,
        SUM(lpv) AS lpv, SUM(atc) AS atc, SUM(checkout) AS checkout,
        SUM(purchases) AS purchases
        FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
        WHERE date BETWEEN @compareStart AND @compareEnd
          AND (@campaign = '' OR campaign_name = @campaign)
      )
      SELECT TO_JSON_STRING(current_period) AS current_data,
             TO_JSON_STRING(compare_period) AS compare_data
      FROM current_period, compare_period
    `;
  }
  if (tab === "creative-daily-4pi") {
    query = `
    WITH daily_campaign AS (
      SELECT
        date,
        campaign_name,
        SAFE_DIVIDE(SUM(spend), SUM(impressions)) * 1000 AS campaign_cpm,
        SAFE_DIVIDE(SUM(spend), SUM(purchases)) AS campaign_cpa
      FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
      WHERE date BETWEEN @start AND @end
        AND (@campaign = '' OR campaign_name = @campaign)
      GROUP BY date, campaign_name
    )

    SELECT
      d.date,
      d.campaign_name,
      d.ad_id,
      d.creative_name,
      SUM(d.spend) AS spend,
      SUM(d.revenue) AS revenue,
      SUM(d.purchases) AS purchases,
      SUM(d.impressions) AS impressions,
      SUM(d.reach) AS reach,
      SUM(d.clicks) AS clicks,
      SAFE_DIVIDE(SUM(d.revenue), SUM(d.spend)) AS roas,
      SAFE_DIVIDE(SUM(d.spend), SUM(d.purchases)) AS cpa,
      SAFE_DIVIDE(SUM(d.clicks), SUM(d.impressions)) * 100 AS ctr,
      SAFE_DIVIDE(SUM(d.spend), SUM(d.impressions)) * 1000 AS cpm,
      SAFE_DIVIDE(SUM(d.impressions), SUM(d.reach)) AS frequency,
      dc.campaign_cpm,
      dc.campaign_cpa
    FROM \`shopify-colab.brillare_shopify.meta_os_daily\` d
    LEFT JOIN daily_campaign dc
      ON d.date = dc.date
      AND d.campaign_name = dc.campaign_name
    WHERE d.date BETWEEN @start AND @end
      AND (@campaign = '' OR d.campaign_name = @campaign)
    GROUP BY
      d.date,
      d.campaign_name,
      d.ad_id,
      d.creative_name,
      dc.campaign_cpm,
      dc.campaign_cpa
    ORDER BY d.creative_name, d.date
  `;
  }

  if (tab === "Recomendations") {
    query = `
    WITH ad_level AS (
      SELECT
        campaign_name,
        adset_name,
        ad_id,
        creative_name,

        SUM(spend) AS spend,
        SUM(revenue) AS revenue,
        SUM(purchases) AS purchases,
        SUM(impressions) AS impressions,
        SUM(reach) AS reach,
        SUM(clicks) AS clicks,
        SUM(lpv) AS lpv,
        SUM(atc) AS atc,
        SUM(checkout) AS checkout,

        SAFE_DIVIDE(SUM(revenue), SUM(spend)) AS roas,
        SAFE_DIVIDE(SUM(spend), SUM(purchases)) AS cpa,
        SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100 AS ctr,
        SAFE_DIVIDE(SUM(spend), SUM(impressions)) * 1000 AS cpm,
        SAFE_DIVIDE(SUM(impressions), SUM(reach)) AS frequency
      FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
      WHERE date BETWEEN @start AND @end
      GROUP BY campaign_name, adset_name, ad_id, creative_name
    ),

    campaign_avg AS (
      SELECT
        campaign_name,
        AVG(spend) AS campaign_avg_spend,
        AVG(roas) AS campaign_avg_roas,
        AVG(cpa) AS campaign_avg_cpa,
        AVG(ctr) AS campaign_avg_ctr,
        AVG(cpm) AS campaign_avg_cpm,
        AVG(frequency) AS campaign_avg_frequency
      FROM ad_level
      GROUP BY campaign_name
    )

    SELECT
      a.*,
      ca.campaign_avg_spend,
      ca.campaign_avg_roas,
      ca.campaign_avg_cpa,
      ca.campaign_avg_ctr,
      ca.campaign_avg_cpm,
      ca.campaign_avg_frequency,

      CASE
        WHEN a.purchases >= 2
          AND a.roas >= ca.campaign_avg_roas * 1.2
          AND a.cpa <= ca.campaign_avg_cpa * 0.8
          THEN 'SCALE NOW'

        WHEN a.spend >= ca.campaign_avg_spend
          AND a.purchases = 0
          THEN 'KILL NOW'

        WHEN a.purchases > 0
          AND a.roas <= ca.campaign_avg_roas * 0.5
          AND a.cpa >= ca.campaign_avg_cpa * 1.5
          THEN 'KILL NOW'

        WHEN a.frequency >= ca.campaign_avg_frequency * 1.2
          AND a.ctr <= ca.campaign_avg_ctr * 0.8
          THEN 'REFRESH NOW'

        WHEN a.ctr >= ca.campaign_avg_ctr
          AND a.purchases = 0
          AND a.spend > 0
          THEN 'INVESTIGATE'

        WHEN a.roas > ca.campaign_avg_roas
          AND a.spend < ca.campaign_avg_spend
          AND a.purchases >= 1
          THEN 'OPPORTUNITY'

        ELSE 'WATCHLIST'
      END AS alert_type,

      CASE
        WHEN a.purchases = 0 THEN a.spend
        ELSE 0
      END AS wasted_spend,

      CASE
        WHEN a.purchases >= 2
          AND a.roas >= ca.campaign_avg_roas * 1.2
          THEN 'Outperforming campaign average. Candidate for more budget.'

        WHEN a.purchases = 0
          AND a.spend >= ca.campaign_avg_spend
          THEN 'High spend with zero purchases versus campaign average.'

        WHEN a.frequency >= ca.campaign_avg_frequency * 1.2
          AND a.ctr <= ca.campaign_avg_ctr * 0.8
          THEN 'Frequency is high and CTR is weak versus campaign average. Creative fatigue likely.'

        WHEN a.ctr >= ca.campaign_avg_ctr
          AND a.purchases = 0
          THEN 'Clicks are coming but purchases are missing. Check PDP, offer, or checkout.'

        WHEN a.roas > ca.campaign_avg_roas
          AND a.spend < ca.campaign_avg_spend
          THEN 'Underfunded winner. Better than campaign average but receiving less spend.'

        ELSE 'Needs more data before action.'
      END AS reason

    FROM ad_level a
    LEFT JOIN campaign_avg ca
      ON a.campaign_name = ca.campaign_name

    ORDER BY
      CASE alert_type
        WHEN 'KILL NOW' THEN 1
        WHEN 'SCALE NOW' THEN 2
        WHEN 'REFRESH NOW' THEN 3
        WHEN 'OPPORTUNITY' THEN 4
        WHEN 'INVESTIGATE' THEN 5
        ELSE 6
      END,
      spend DESC
  `;
  }


  if (!query) {
    return Response.json({ error: "Invalid Meta OS tab" }, { status: 400 });
  }

  try {
    const [rows] = await bigquery.query({
      query,
      params: { start, end, compareStart, compareEnd, campaign },
    });

    if (tab === "overview" || tab === "funnel") {
      const row: any = rows[0] || {};
      return Response.json({
        current: JSON.parse(row.current_data || "{}"),
        compare: JSON.parse(row.compare_data || "{}"),
      });
    }

    if (tab === "trend") {
      return Response.json(
        rows.map((row: any) => ({
          ...row,
          date: row.date?.value || row.date,
        }))
      );
    }
    if (tab === "creative-daily-4pi") {
      return Response.json(
        rows.map((row: any) => ({
          ...row,
          date: row.date?.value || row.date,
        }))
      );
    }
    return Response.json(rows);
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}