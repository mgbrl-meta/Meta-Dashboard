import { NextResponse } from "next/server";
import { bigquery } from "../../../lib/bigquery";

export async function GET() {
  const query = `
    SELECT *
    FROM \`shopify-colab.brillare_shopify.ceo_summary_daily\`
    ORDER BY date DESC
    LIMIT 90
  `;

  const [rows] = await bigquery.query({ query });

  const cleanRows = rows.map((row: any) => ({
  ...row,
  date: row.date?.value || row.date,
  }));

  return NextResponse.json(cleanRows);
}