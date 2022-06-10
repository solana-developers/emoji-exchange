use anchor_lang::prelude::*;

pub fn create_user_account(
    ctx: Context<CreateUser>, 
    name: String
) -> Result<()> {
    let user = &mut ctx.accounts.user;
    user.name = name;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(
        init, 
        payer = wallet, 
        space = 8 + 40,
        seeds = [user.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct User {
    pub name: String,
}


pub fn create_user_emoji_account(
    ctx: Context<CreateUserEmoji>, 
    balance: u64
) -> Result<()> {
    let user_emoji = &mut ctx.accounts.user_emoji;
    user_emoji.authority = ctx.accounts.user.key();
    user_emoji.balance = balance;
    Ok(())
}

#[derive(Accounts)]
#[instruction(emoji_seed: String)]
pub struct CreateUserEmoji<'info> {
    #[account(
        init, 
        payer = user, 
        space = 8 + 40,
        seeds = [user.key().as_ref(), "_".as_ref(), emoji_seed.as_ref()],
        bump
    )]
    pub user_emoji: Account<'info, UserEmoji>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserEmoji {
    pub authority: Pubkey,
    pub balance: u64,
}