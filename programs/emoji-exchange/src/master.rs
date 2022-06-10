use anchor_lang::prelude::*;

pub fn create_master_emoji_account(
    ctx: Context<CreateMasterEmoji>, 
    balance: u64
) -> Result<()> {
    let master_emoji = &mut ctx.accounts.master_emoji;
    master_emoji.balance = balance;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateMasterEmoji<'info> {
    #[account(
        init, 
        payer = wallet, 
        space = 8 + 40,
        seeds = ["master_emoji".as_ref()],
        bump
    )]
    pub master_emoji: Account<'info, MasterEmoji>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MasterEmoji {
    pub balance: u64,
}