use anchor_lang::prelude::*;

pub mod master;
pub mod order;
pub mod user;

use master::*;
use order::*;
use user::*;

declare_id!("9WxF3Zm9G1CeTzdYxevQvH5eBYWUVjmn9mUynju5urYK");

#[program]
mod emoji_exchange {
    use super::*;

    pub fn create_master_emoji_account(
        ctx: Context<CreateMasterEmoji>, 
        balance: u64
    ) -> Result<()> {
        master::create_master_emoji_account(ctx, balance)
    }

    pub fn create_user_account(
        ctx: Context<CreateUser>, 
        name: String
    ) -> Result<()> {
        user::create_user_account(ctx, name)
    }

    pub fn create_user_emoji_account(
        ctx: Context<CreateUserEmoji>, 
        authority: Pubkey,
        balance: u64
    ) -> Result<()> {
        user::create_user_emoji_account(ctx, authority, balance)
    }

    pub fn place_order(
        ctx: Context<Order>,
        order_type: OrderType, 
        amount: u64
    ) -> Result<()> {
        order::place_order(ctx, order_type, amount)
    }
}
