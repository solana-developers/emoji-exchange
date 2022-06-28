use anchor_lang::prelude::*;

pub mod master;
pub mod order;
pub mod user;

use master::*;
use order::*;
use user::*;


declare_id!("HctzMECBUu8gg4an7RjUaBXibGEcL3WD41P33JsyqwWe");


const LAMPORTS_PER_SOL: u64 = 1000000000;
const EMOJI_STARTING_PRICE: u64 = LAMPORTS_PER_SOL / 20;


#[program]
mod emoji_exchange {
    use super::*;

    pub fn create_master_emoji_account(
        ctx: Context<CreateMasterEmoji>, 
        emoji_seed: String, 
        starting_balance: u32,
        authority: Pubkey,
    ) -> Result<()> {
        master::create_master_emoji_account(
            ctx, emoji_seed, starting_balance, authority
        )
    }

    pub fn create_user_emoji_account(
        ctx: Context<CreateUserEmoji>, 
        emoji_seed: String,
        authority: Pubkey,
    ) -> Result<()> {
        user::create_user_emoji_account(
            ctx, emoji_seed, authority
        )
    }

    pub fn place_order(
        ctx: Context<Order>,
        order_type: OrderType, 
        amount: u32
    ) -> Result<()> {
        order::place_order(
            ctx, order_type, amount
        )
    }
}
