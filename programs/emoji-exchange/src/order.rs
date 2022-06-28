use anchor_lang::prelude::*;

use crate::EMOJI_STARTING_PRICE;
use crate::master::*;
use crate::user::*;


pub fn place_order(
    ctx: Context<Order>, 
    order_type: OrderType, 
    amount: u32
) -> Result<()> {
    
    let master_emoji = &mut ctx.accounts.master_emoji;
    let user_emoji = &mut ctx.accounts.user_emoji;

    let price_action = EMOJI_STARTING_PRICE * amount as u64;

    match order_type {
        OrderType::Buy => {
            msg!("Request to buy emoji {}", &master_emoji.name);
            master_emoji.balance -= amount;
            master_emoji.price += price_action;
            user_emoji.balance += amount;
        },
        OrderType::Sell => {
            msg!("Request to sell emoji {}", &master_emoji.name);
            master_emoji.balance += amount;
            master_emoji.price -= price_action;
            user_emoji.balance -= amount;
        }
    };
    msg!("Success.");
    
    Ok(())
}

#[derive(Accounts)]
pub struct Order<'info> {
    #[account(mut)]
    pub master_emoji: Account<'info, MasterEmoji>,
    #[account(mut)]
    pub user_emoji: Account<'info, UserEmoji>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub enum OrderType {
    Buy,
    Sell,
}