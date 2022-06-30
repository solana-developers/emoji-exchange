use anchor_lang::prelude::*;

pub mod master;
pub mod order;
// pub mod price;
pub mod user;

use master::*;
use order::*;
// use price::*;
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
    ) -> Result<()> {
        master::create_master_emoji_account(
            ctx, emoji_seed, starting_balance
        )
    }

    pub fn create_user_metadata_account(
        ctx: Context<CreateUserMetadata>, 
        user_pubkey: Pubkey, 
        username: String,
    ) -> Result<()> {
        user::create_user_metadata_account(
            ctx, user_pubkey, username
        )
    }

    pub fn create_user_emoji_account(
        ctx: Context<CreateUserEmoji>, 
        user_pubkey: Pubkey, 
        emoji_seed: String,
    ) -> Result<()> {
        user::create_user_emoji_account(
            ctx, user_pubkey, emoji_seed
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

    // pub fn change_price(
    //     ctx: Context<ChangePrice>,
    //     emoji_seed: String,
    // ) -> Result<()> {
    //     price::change_price(
    //         ctx, emoji_seed
    //     )
    // }
}
