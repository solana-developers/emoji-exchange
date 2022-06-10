use anchor_lang::prelude::*;

use crate::master::*;
use crate::user::*;

pub fn place_order(
    ctx: Context<Order>, 
    order_type: OrderType, 
    amount: u64
) -> Result<()> {
    
    let master_emoji = &mut ctx.accounts.master_emoji;
    let user_emoji = &mut ctx.accounts.user_emoji;

    match order_type {
        BUY => {
            master_emoji.balance -= amount;
            user_emoji.balance += amount;
        },
        SELL => {
            master_emoji.balance += amount;
            user_emoji.balance -= amount;
        }
    };
    
    Ok(())
}

#[derive(Accounts)]
pub struct Order<'info> {
    #[account(mut)]
    pub master_emoji: Account<'info, MasterEmoji>,
    #[account(mut, has_one = authority)]
    pub user_emoji: Account<'info, UserEmoji>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub enum OrderType {
    BUY,
    SELL,
}