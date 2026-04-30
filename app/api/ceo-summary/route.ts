import { NextResponse } from "next/server";
import { bigquery } from "../../../lib/bigquery";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const query = `
    SELECT *
    FROM \`shopify-colab.brillare_shopify.ceo_summary_daily\`
    WHERE date BETWEEN @start AND @end
    ORDER BY date DESC
  `;

  const [rows] = await bigquery.query({
    query,
    params: { start, end },
  });

  const cleanRows = rows.map((row: any) => ({
    ...row,
    date: row.date?.value || row.date,
  }));

  return NextResponse.json(cleanRows);
}