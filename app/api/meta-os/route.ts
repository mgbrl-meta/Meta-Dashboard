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
        SELECT
          SUM(spend) AS spend,
          SUM(revenue) AS revenue,
          SUM(purchases) AS purchases,
          SUM(impressions) AS impressions,
          SUM(reach) AS reach,
          SUM(clicks) AS clicks,
          SUM(lpv) AS lpv,
          SUM(atc) AS atc,
          SUM(checkout) AS checkout
        FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
        WHERE date BETWEEN @start AND @end
      ),

      compare_period AS (
        SELECT
          SUM(spend) AS spend,
          SUM(revenue) AS revenue,
          SUM(purchases) AS purchases,
          SUM(impressions) AS impressions,
          SUM(reach) AS reach,
          SUM(clicks) AS clicks,
          SUM(lpv) AS lpv,
          SUM(atc) AS atc,
          SUM(checkout) AS checkout
        FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
        WHERE date BETWEEN @compareStart AND @compareEnd
      )

      SELECT
        TO_JSON_STRING(current_period) AS current_data,
        TO_JSON_STRING(compare_period) AS compare_data
      FROM current_period, compare_period
    `;
  }

  if (tab === "campaign") {
    query = `
      SELECT
        campaign_id,
        campaign_name,
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
      GROUP BY
        campaign_name,
        adset_id,
        adset_name,
        ct.campaign_spend,
        ct.campaign_revenue,
        ct.campaign_purchases,
        ct.campaign_reach
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
        SUM(clicks) AS clicks,
        SAFE_DIVIDE(SUM(revenue), SUM(spend)) AS roas,
        SAFE_DIVIDE(SUM(spend), SUM(purchases)) AS cpa,
        SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100 AS ctr,
        SAFE_DIVIDE(SUM(spend), SUM(impressions)) * 1000 AS cpm,
        ca.campaign_roas,
        ca.campaign_ctr,
        ca.campaign_cpa,
        ca.campaign_cpm,
        COALESCE(
            SAFE_DIVIDE(
                SAFE_DIVIDE(SUM(revenue), SUM(spend)),
                NULLIF(ca.campaign_roas, 0)
            ),
            0
        ) AS roas_index,
        COALESCE(
            SAFE_DIVIDE(
                SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100,
                NULLIF(ca.campaign_ctr, 0)
            ),
            0
        ) AS ctr_index
      FROM \`shopify-colab.brillare_shopify.meta_os_daily\`, campaign_avg ca
      WHERE date BETWEEN @start AND @end
        AND (@campaign = '' OR campaign_name = @campaign)
      GROUP BY
        creative_name,
        ca.campaign_roas,
        ca.campaign_ctr,
        ca.campaign_cpa,
        ca.campaign_cpm
      ORDER BY spend DESC
    `;
  }

  if (tab === "funnel") {
    query = `
      WITH current_period AS (
        SELECT
          SUM(impressions) AS impressions,
          SUM(clicks) AS clicks,
          SUM(lpv) AS lpv,
          SUM(atc) AS atc,
          SUM(checkout) AS checkout,
          SUM(purchases) AS purchases
        FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
        WHERE date BETWEEN @start AND @end
          AND (@campaign = '' OR campaign_name = @campaign)
      ),

      compare_period AS (
        SELECT
          SUM(impressions) AS impressions,
          SUM(clicks) AS clicks,
          SUM(lpv) AS lpv,
          SUM(atc) AS atc,
          SUM(checkout) AS checkout,
          SUM(purchases) AS purchases
        FROM \`shopify-colab.brillare_shopify.meta_os_daily\`
        WHERE date BETWEEN @compareStart AND @compareEnd
          AND (@campaign = '' OR campaign_name = @campaign)
      )

      SELECT
        TO_JSON_STRING(current_period) AS current_data,
        TO_JSON_STRING(compare_period) AS compare_data
      FROM current_period, compare_period
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

  try {
    const [rows] = await bigquery.query({
      query,
      params: {
        start,
        end,
        compareStart,
        compareEnd,
        campaign,
      },
    });

    if (tab === "overview" || tab === "funnel") {
      const row: any = rows[0];

      return Response.json({
        current: JSON.parse(row.current_data),
        compare: JSON.parse(row.compare_data),
      });
    }

    return Response.json(rows);

  } catch (err: any) {
    return Response.json({
      error: err.message,
    });
  }

  if (tab === "overview" || tab === "funnel") {
    const row: any = rows[0];

    return Response.json({
      current: JSON.parse(row.current_data),
      compare: JSON.parse(row.compare_data),
    });
  }

  return Response.json(rows);
}