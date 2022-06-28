use anchor_lang::{
    prelude::*,
    system_program,
};

use crate::EMOJI_STARTING_PRICE;
use crate::master::*;
use crate::user::*;


pub fn place_order(
    ctx: Context<Order>, 
    order_type: OrderType, 
    amount: u32
) -> Result<()> {
    
    let master_emoji = &mut ctx.accounts.master_emoji;
    let emoji_price_account = &mut ctx.accounts.emoji_price_account;
    let user_emoji = &mut ctx.accounts.user_emoji;

    let price_action = EMOJI_STARTING_PRICE * amount as u64;

    match order_type {

        OrderType::Buy => {

            msg!("Request to buy emoji {}", &master_emoji.name);

            if amount > master_emoji.balance {
                msg!("Emoji: {}", &master_emoji.name);
                msg!("Store balance: {}", master_emoji.balance);
                return Err(error!(OrderError::InsufficientStoreBalance))
            };

            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.user_wallet.to_account_info(),
                        to: ctx.accounts.master_wallet.to_account_info(),
                    }
                ),
                emoji_price_account.price * amount as u64
            )?;

            master_emoji.balance -= amount;
            emoji_price_account.price += price_action;
            user_emoji.balance += amount;
        },
        OrderType::Sell => {

            msg!("Request to sell emoji {}", &master_emoji.name);

            if amount > user_emoji.balance {
                msg!("Emoji: {}", &user_emoji.name);
                msg!("User balance: {}", user_emoji.balance);
                return Err(error!(OrderError::InsufficientStoreBalance))
            };

            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.master_wallet.to_account_info(),
                        to: ctx.accounts.user_wallet.to_account_info(),
                    }
                ),
                emoji_price_account.price * amount as u64
            )?;

            master_emoji.balance += amount;
            emoji_price_account.price -= price_action;
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
    pub emoji_price_account: Account<'info, EmojiPrice>,
    #[account(mut)]
    pub user_emoji: Account<'info, UserEmoji>,
    #[account(mut)]
    pub master_wallet: Signer<'info>,
    #[account(mut)]
    pub user_wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub enum OrderType {
    Buy,
    Sell,
}

#[error_code]
pub enum OrderError {
    #[msg("Insufficient store balance.")]
    InsufficientStoreBalance,
    #[msg("Insufficient user balance.")]
    InsufficientUserBalance,
}