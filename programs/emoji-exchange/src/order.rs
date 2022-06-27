use anchor_lang::prelude::*;

use crate::emoji::*;

pub fn place_order(
    ctx: Context<Order>, 
    order_type: OrderType, 
    amount: u32
) -> Result<()> {
    
    let master_emoji = &mut ctx.accounts.master_emoji;
    let user_emoji = &mut ctx.accounts.user_emoji;

    match order_type {
        OrderType::Buy => {
            msg!("Request to buy emoji {}", &master_emoji.name);
            master_emoji.balance -= amount;
            user_emoji.balance += amount;
        },
        OrderType::Sell => {
            msg!("Request to sell emoji {}", &master_emoji.name);
            master_emoji.balance += amount;
            user_emoji.balance -= amount;
        }
    };
    msg!("Success.");
    
    Ok(())
}

#[derive(Accounts)]
pub struct Order<'info> {
    #[account(mut)]
    pub master_emoji: Account<'info, Emoji>,
    #[account(mut)]
    pub user_emoji: Account<'info, Emoji>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub enum OrderType {
    Buy,
    Sell,
}