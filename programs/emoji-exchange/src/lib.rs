use anchor_lang::prelude::*;

pub mod emoji;
pub mod order;

use emoji::*;
use order::*;

declare_id!("HctzMECBUu8gg4an7RjUaBXibGEcL3WD41P33JsyqwWe");

#[program]
mod emoji_exchange {
    use super::*;

    pub fn create_emoji_account(
        ctx: Context<CreateEmoji>, 
        account_type_seed: String,
        emoji_seed: String, 
        starting_balance: u32
    ) -> Result<()> {
        emoji::create_emoji_account(
            ctx, account_type_seed, emoji_seed, starting_balance
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
