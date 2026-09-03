import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({ok:true,service:"kitsetups-signals",status:"standalone",signals:[],message:"Signals API contract is ready. Live signal delivery will be enabled when the trading data layer is connected."});}
