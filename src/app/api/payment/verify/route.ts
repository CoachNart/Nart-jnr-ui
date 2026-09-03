import { NextResponse } from "next/server";

const USDT="0x55d398326f99059ff775485246999027b3197955";
const TRANSFER_TOPIC="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a5df523b3ef";
const RPC="https://bsc-dataseed.binance.org";
const REQUIRED=30n*10n**18n;

async function rpc(method:string,params:unknown[]){
 const r=await fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),cache:"no-store"});
 if(!r.ok)throw new Error("RPC unavailable");
 const j=await r.json();
 if(j.error)throw new Error(j.error.message||"RPC error");
 return j.result;
}

export async function POST(req:Request){
 try{
  const {txHash}=await req.json();
  const wallet=(process.env.NEXT_PUBLIC_BNB_USDT_PAYMENT_ADDRESS||process.env.BNB_USDT_PAYMENT_ADDRESS||"").toLowerCase();
  if(!wallet)return NextResponse.json({error:"Payment wallet is not configured yet."},{status:503});
  if(!/^0x[a-fA-F0-9]{64}$/.test(txHash||""))return NextResponse.json({error:"Invalid transaction hash."},{status:400});
  if(!/^0x[a-fA-F0-9]{40}$/.test(wallet))return NextResponse.json({error:"Payment wallet configuration is invalid."},{status:500});
  const [tx,receipt]=await Promise.all([rpc("eth_getTransactionByHash",[txHash]),rpc("eth_getTransactionReceipt",[txHash])]);
  if(!tx||!receipt)return NextResponse.json({error:"Transaction not found yet. Wait for confirmation and try again."},{status:404});
  if(receipt.status!=="0x1")return NextResponse.json({error:"Transaction failed on BNB Smart Chain."},{status:400});
  const match=(receipt.logs||[]).some((log:any)=>{
   if(String(log.address).toLowerCase()!==USDT)return false;
   if(!log.topics||log.topics.length<3||String(log.topics[0]).toLowerCase()!==TRANSFER_TOPIC)return false;
   const to="0x"+String(log.topics[2]).slice(-40).toLowerCase();
   let value=0n;try{value=BigInt(log.data)}catch{return false}
   return to===wallet&&value>=REQUIRED;
  });
  if(!match)return NextResponse.json({error:"No confirmed 30 USDT payment to the configured KitSetups wallet was found in this transaction."},{status:400});
  return NextResponse.json({verified:true,network:"BNB Smart Chain",asset:"USDT",amount:30});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Verification failed."},{status:500});}
}
