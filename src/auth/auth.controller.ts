import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
  Get,
  HttpCode,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { LocalAuthGuard } from 'src/common/guards/local-auth.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LoginUserDto } from './dto/login-user.dto';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterResponse } from './dto/register-reponse.dto';
@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user has been successfully registered.',
    type: RegisterResponse,
  })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<RegisterResponse> {
    try {
      return await this.authService.register(
        createUserDto.email,
        createUserDto.password,
        createUserDto.name,
      );
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user has been successfully logged in.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials provided.',
  })
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // The user is already validated by LocalAuthGuard and attached to request
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const loginData = await this.authService.login(user);

    response.setHeader('Authorization', `Bearer ${loginData.access_token}`);

    return {
      message: 'Login successful',
      access_token: loginData.access_token,
      user: loginData.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user has been successfully logged out.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully.',
  })
  getProfile(@Req() request: Request) {
    return {
      user: request.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User token is valid.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User token is invalid or expired.',
  })
  verifyToken(@Req() request: Request) {
    return {
      valid: true,
      user: request.user,
    };
  }
}
